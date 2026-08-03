# blog-views — Cloudflare Worker view counter

Free per-post view counter for blog.khaledalam.net (Cloudflare Workers + KV free tier).
Seeded with the 77,516 views migrated from the WordPress Post Views Counter plugin.

## One-time deploy

```bash
cd counter
npm install

# 1. Log in to Cloudflare (opens a browser; run this yourself in the terminal)
npx wrangler login

# 2. Create the KV namespace, then paste the printed id into wrangler.toml
#    (replace REPLACE_WITH_KV_NAMESPACE_ID)
npx wrangler kv namespace create VIEWS

# 3. Seed the existing view counts (31 posts, 77,516 views)
npx wrangler kv bulk put --binding=VIEWS seed-kv.json

# 4. Deploy the worker
npx wrangler deploy
```

`wrangler deploy` prints the live URL, e.g.
`https://blog-views.<your-subdomain>.workers.dev`.

## Wire it into the blog

Put that URL in `site/src/config.ts`:

```ts
export const COUNTER_URL = 'https://blog-views.<your-subdomain>.workers.dev';
```

Commit + push — GitHub Actions rebuilds the blog and the live counter goes active.
Until then, each post shows its static seeded count (no increment).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/hit/:slug`  | increment, return `{ slug, views }` |
| GET  | `/get/:slug`  | read without incrementing |
| GET  | `/get?slugs=a,b` | batch read |

## Free-tier limits

Workers free tier = 100,000 requests/day; KV free tier = 100,000 reads + 1,000
writes/day, 1 GB storage. One write per page view; the blog's traffic is far
under this.

## Verify seeded data

```bash
npx wrangler kv key get --binding=VIEWS "v:contributing-to-php-core"   # -> 1573
```
