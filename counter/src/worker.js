// blog.khaledalam.net backend — Cloudflare Worker + D1.
//
// Views:
//   POST /hit/:slug          increment, returns { slug, views }
//   GET  /get/:slug          read, no increment
//   GET  /get?slugs=a,b,c    batch read, no increment
//
// Comments (self-hosted, no GitHub account needed):
//   GET  /comments/:slug     approved comments only
//   POST /comments/:slug     { name, body, token, hp } -> stored as PENDING
//   GET  /admin              moderation UI (token-gated, noindex)
//   GET  /admin/list         pending + approved, needs X-Admin-Token
//   POST /admin/approve/:id  needs X-Admin-Token
//   POST /admin/delete/:id   needs X-Admin-Token
//
// Storage is D1, not KV, and that is deliberate. KV has no atomic increment:
// read-then-write meant simultaneous visitors overwrote each other and ten
// concurrent hits recorded one view. D1 increments in a single SQL statement.
//
// Comments are held for approval — nothing a reader submits is ever publicly
// visible before it is approved.

const ALLOW = new Set([
  'https://blog.khaledalam.net',
  'https://khaledalam.net',
  'https://khaledalam.github.io',
  'http://localhost:8099',
  'http://localhost:4321',
]);

const MAX_NAME = 60;
const MAX_BODY = 4000;
const RATE_LIMIT = 5; // comments per IP per window
const RATE_WINDOW = 10 * 60 * 1000;

function corsHeaders(origin) {
  const allowed = ALLOW.has(origin) ? origin : 'https://blog.khaledalam.net';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token',
    'Vary': 'Origin',
  };
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time-ish compare so the admin token can't be guessed by timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyTurnstile(token, ip, secret) {
  if (!secret) return true; // not configured yet — don't lock out commenting
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const out = await r.json();
  return out.success === true;
}

const ADMIN_HTML = `<!doctype html><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comment moderation</title>
<style>
:root{color-scheme:light dark}
body{font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem}
h1{font-size:1.25rem}
input,button{font:inherit;padding:.45rem .6rem}
.c{border:1px solid #8883;border-radius:8px;padding:.75rem .9rem;margin:.6rem 0}
.m{color:#8a8a8a;font-size:.82rem}
.b{white-space:pre-wrap;overflow-wrap:anywhere;margin:.4rem 0 .6rem}
button{cursor:pointer;border-radius:6px;border:1px solid #8884;background:transparent}
button.ok{border-color:#2b8a3e;color:#2b8a3e}
button.no{border-color:#c92a2a;color:#c92a2a}
.pend{border-left:3px solid #f59f00}
</style>
<h1>Comment moderation</h1>
<p><input id="t" type="password" placeholder="admin token" size="34"> <button onclick="save()">Load</button></p>
<div id="out"></div>
<script>
const API = location.origin;
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tok(){ return localStorage.getItem('adminToken') || '' }
function save(){ localStorage.setItem('adminToken', document.getElementById('t').value.trim()); load() }
async function api(p, m){
  const r = await fetch(API + p, { method: m || 'GET', headers: { 'X-Admin-Token': tok() } });
  if (r.status === 401) { document.getElementById('out').textContent = 'Bad token.'; return null }
  return r.json();
}
async function act(id, what){ await api('/admin/' + what + '/' + id, 'POST'); load() }
async function load(){
  const d = await api('/admin/list'); if (!d) return;
  const row = c => '<div class="c ' + (c.approved ? '' : 'pend') + '">' +
    '<div class="m">' + esc(c.name) + ' &middot; ' + new Date(c.created_at).toLocaleString() +
    ' &middot; <a href="https://blog.khaledalam.net/' + encodeURI(c.slug) + '/" target="_blank">' + esc(c.slug) + '</a>' +
    (c.approved ? ' &middot; approved' : ' &middot; <b>pending</b>') + '</div>' +
    '<div class="b">' + esc(c.body) + '</div>' +
    (c.approved ? '' : '<button class="ok" onclick="act(' + c.id + ',\\'approve\\')">Approve</button> ') +
    '<button class="no" onclick="act(' + c.id + ',\\'delete\\')">Delete</button></div>';
  document.getElementById('out').innerHTML =
    '<h2>Pending (' + d.pending.length + ')</h2>' + (d.pending.map(row).join('') || '<p class="m">Nothing waiting.</p>') +
    '<h2>Approved (' + d.approved.length + ')</h2>' + (d.approved.map(row).join('') || '<p class="m">None yet.</p>');
}
if (tok()) load();
</script>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };
    const db = env.blog_views;
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers });

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    try {
      // ---------- admin ----------
      if (url.pathname === '/admin') {
        return new Response(ADMIN_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
        });
      }

      if (url.pathname.startsWith('/admin/')) {
        if (!env.ADMIN_TOKEN || !safeEqual(request.headers.get('X-Admin-Token') || '', env.ADMIN_TOKEN)) {
          return json({ error: 'unauthorized' }, 401);
        }
        if (url.pathname === '/admin/list') {
          const { results } = await db
            .prepare('SELECT id, slug, name, body, created_at, approved FROM comments ORDER BY created_at DESC LIMIT 500')
            .all();
          return json({
            pending: results.filter((c) => !c.approved),
            approved: results.filter((c) => c.approved),
          });
        }
        const m = url.pathname.match(/^\/admin\/(approve|delete)\/(\d+)$/);
        if (m && request.method === 'POST') {
          const [, what, id] = m;
          if (what === 'approve') await db.prepare('UPDATE comments SET approved = 1 WHERE id = ?').bind(id).run();
          else await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
          return json({ ok: true });
        }
        return json({ error: 'not found' }, 404);
      }

      // ---------- comments ----------
      const cm = url.pathname.match(/^\/comments\/(.+)$/);
      if (cm) {
        const slug = decodeURIComponent(cm[1]);

        if (request.method === 'GET') {
          const { results } = await db
            .prepare('SELECT name, body, created_at FROM comments WHERE slug = ? AND approved = 1 ORDER BY created_at ASC LIMIT 200')
            .bind(slug)
            .all();
          return json({ slug, comments: results });
        }

        if (request.method === 'POST') {
          let payload;
          try { payload = await request.json(); } catch (_) { return json({ error: 'bad request' }, 400); }

          // Honeypot: a hidden field real users never fill in.
          if (payload.hp) return json({ ok: true, pending: true });

          const name = String(payload.name ?? '').trim();
          const body = String(payload.body ?? '').trim();
          if (!name || !body) return json({ error: 'Name and comment are both required.' }, 400);
          if (name.length > MAX_NAME) return json({ error: `Name must be under ${MAX_NAME} characters.` }, 400);
          if (body.length > MAX_BODY) return json({ error: `Comment must be under ${MAX_BODY} characters.` }, 400);

          const ip = request.headers.get('CF-Connecting-IP') || '';
          const ipHash = ip ? await sha256(ip + (env.ADMIN_TOKEN || 'salt')) : null;

          if (ipHash) {
            const row = await db
              .prepare('SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ? AND created_at > ?')
              .bind(ipHash, Date.now() - RATE_WINDOW)
              .first();
            if ((row?.n ?? 0) >= RATE_LIMIT) {
              return json({ error: 'Too many comments just now — try again shortly.' }, 429);
            }
          }

          if (!(await verifyTurnstile(payload.token, ip, env.TURNSTILE_SECRET))) {
            return json({ error: 'Bot check failed — please reload and try again.' }, 403);
          }

          await db
            .prepare('INSERT INTO comments (slug, name, body, created_at, approved, ip_hash) VALUES (?, ?, ?, ?, 0, ?)')
            .bind(slug, name, body, Date.now(), ipHash)
            .run();
          return json({ ok: true, pending: true });
        }

        return json({ error: 'method not allowed' }, 405);
      }

      // ---------- views ----------
      // No decodeURIComponent here: searchParams.get() already decoded once, and
      // stored slugs are themselves percent-encoded for Arabic posts. Decoding
      // twice produced keys that never matched, so Arabic posts read back as 0.
      if (url.pathname === '/get' && url.searchParams.has('slugs')) {
        const slugs = url.searchParams.get('slugs').split(',').map((s) => s.trim()).filter(Boolean);
        const out = {};
        if (slugs.length) {
          const holes = slugs.map(() => '?').join(',');
          const { results } = await db
            .prepare(`SELECT slug, count FROM views WHERE slug IN (${holes})`)
            .bind(...slugs)
            .all();
          for (const s of slugs) out[s] = 0;
          for (const r of results) out[r.slug] = r.count;
        }
        return json({ views: out });
      }

      const m = url.pathname.match(/^\/(hit|get)\/(.+)$/);
      if (!m) return json({ error: 'not found' }, 404);

      const action = m[1];
      const slug = decodeURIComponent(m[2]);

      if (action === 'hit' && request.method === 'POST') {
        // Single atomic statement: no read-modify-write race.
        const row = await db
          .prepare(
            `INSERT INTO views (slug, count) VALUES (?, 1)
             ON CONFLICT(slug) DO UPDATE SET count = count + 1
             RETURNING count`,
          )
          .bind(slug)
          .first();
        return json({ slug, views: row?.count ?? 0 });
      }

      const row = await db.prepare('SELECT count FROM views WHERE slug = ?').bind(slug).first();
      return json({ slug, views: row?.count ?? 0 });
    } catch (err) {
      return json({ error: 'server error' }, 500);
    }
  },
};
