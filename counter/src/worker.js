// blog.khaledalam.net view counter — Cloudflare Worker + KV.
// Routes:
//   POST /hit/:slug  -> increment and return { slug, views }
//   GET  /get/:slug  -> return { slug, views } without incrementing
//   GET  /get?slugs=a,b,c -> batch read (no increment)
// KV binding: VIEWS. Keys are stored as `v:<raw post slug>`.

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

const key = (slug) => `v:${slug}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') return new Response(null, { headers });

    // batch read: /get?slugs=a,b,c
    if (url.pathname === '/get' && url.searchParams.has('slugs')) {
      const slugs = url.searchParams.get('slugs').split(',').map((s) => decodeURIComponent(s.trim())).filter(Boolean);
      const out = {};
      for (const s of slugs) out[s] = parseInt((await env.VIEWS.get(key(s))) || '0', 10);
      return new Response(JSON.stringify({ views: out }), { headers });
    }

    const m = url.pathname.match(/^\/(hit|get)\/(.+)$/);
    if (!m) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });

    const action = m[1];
    const slug = decodeURIComponent(m[2]);
    const k = key(slug);
    let n = parseInt((await env.VIEWS.get(k)) || '0', 10);

    if (action === 'hit' && request.method === 'POST') {
      n += 1;
      await env.VIEWS.put(k, String(n));
    }
    return new Response(JSON.stringify({ slug, views: n }), { headers });
  },
};
