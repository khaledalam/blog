// blog.khaledalam.net view counter — Cloudflare Worker + D1.
// Routes:
//   POST /hit/:slug  -> increment and return { slug, views }
//   GET  /get/:slug  -> return { slug, views } without incrementing
//   GET  /get?slugs=a,b,c -> batch read (no increment)
//
// Storage is D1, not KV, and that is deliberate. KV has no atomic increment:
// the old implementation did read-then-write, so simultaneous visitors all read
// the same number and overwrote each other. Ten concurrent hits recorded one
// view. D1 does the whole increment in a single SQL statement, so concurrent
// visits each count exactly once.

const ALLOW = new Set([
  'https://blog.khaledalam.net',
  'https://khaledalam.net',
  'https://khaledalam.github.io',
  'http://localhost:8099',
  'http://localhost:4321',
]);

function corsHeaders(origin) {
  const allowed = ALLOW.has(origin) ? origin : 'https://blog.khaledalam.net';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };
    const db = env.blog_views;

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    try {
      // batch read: /get?slugs=a,b,c
      // No decodeURIComponent — searchParams.get() has already decoded once, and
      // the stored slugs are themselves percent-encoded for Arabic posts.
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
        return new Response(JSON.stringify({ views: out }), { headers });
      }

      const m = url.pathname.match(/^\/(hit|get)\/(.+)$/);
      if (!m) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });

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
        return new Response(JSON.stringify({ slug, views: row?.count ?? 0 }), { headers });
      }

      const row = await db.prepare('SELECT count FROM views WHERE slug = ?').bind(slug).first();
      return new Response(JSON.stringify({ slug, views: row?.count ?? 0 }), { headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'counter unavailable' }), { status: 500, headers });
    }
  },
};
