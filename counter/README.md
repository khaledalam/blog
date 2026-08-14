# blog-views — Cloudflare Worker backend

Free backend for blog.khaledalam.net: **per-post view counts** and
**self-hosted comments**. Cloudflare Workers + D1, all on the free tier.

Served from **https://views.khaledalam.net** (a Workers custom domain) rather
than `*.workers.dev`, which ad blockers and corporate networks routinely block —
that would silently undercount views and break the comment form for those readers.

View counts were seeded with the 77,516 views migrated from the WordPress Post
Views Counter plugin.

## Why D1 and not KV

It used to be KV. **KV has no atomic increment**, so the Worker did
read-then-write and simultaneous visitors overwrote each other — ten concurrent
hits recorded **one** view. Every sequential test passed, which is why it went
unnoticed for a while.

D1 does the whole increment in one statement, so concurrent visits each count:

```sql
INSERT INTO views (slug, count) VALUES (?, 1)
ON CONFLICT(slug) DO UPDATE SET count = count + 1
RETURNING count
```

Always test a counter change **concurrently**, never sequentially:

```bash
for i in $(seq 1 25); do curl -sX POST "$API/hit/__test__" >/dev/null & done; wait
curl -s "$API/get/__test__"      # must be exactly 25
```

The KV namespace is still bound but unused — it holds the original migrated
counts as a fallback. Don't delete it yet.

## Deploy

```bash
cd counter
npx wrangler login     # browser OAuth; cannot be done from the CLI
./deploy.sh            # everything else is automated
```

`deploy.sh` creates the KV namespace, writes the id into `wrangler.toml`, seeds,
deploys, and prints the URL for `COUNTER_URL` in `../src/config.ts`.

For a D1 schema change:

```bash
npx wrangler d1 execute blog-views --remote --file=schema.sql           # views
npx wrangler d1 execute blog-views --remote --file=comments-schema.sql  # comments
npx wrangler deploy
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/hit/:slug` | increment, return `{ slug, views }` |
| GET | `/get/:slug` | read without incrementing |
| GET | `/get?slugs=a,b` | batch read (used by the blog index) |
| GET | `/comments/:slug` | **approved** comments only |
| POST | `/comments/:slug` | submit `{ name, body, token, hp }` → stored **pending** |
| GET | `/admin` | moderation UI + top posts (token-gated, `noindex`) |
| GET | `/admin/feed.xml?token=` | RSS of pending comments (how you find out one arrived) |
| GET | `/admin/list` | pending + approved, needs `X-Admin-Token` |
| POST | `/admin/approve/:id` | needs `X-Admin-Token` |
| POST | `/admin/delete/:id` | needs `X-Admin-Token` |

**Never `decodeURIComponent` in the batch route.** `searchParams.get()` already
decodes once, and stored slugs are themselves percent-encoded for Arabic posts.
Decoding twice produced keys that never matched, so Arabic posts read back as 0.

## Comments

Self-hosted, no GitHub account required. **Every comment is held for approval** —
nothing a reader submits is publicly visible until approved at `/admin`.

Spam defence is three independent layers:

1. **Turnstile** (managed mode) — sitekey is public in `src/config.ts`, secret is
   the Worker secret `TURNSTILE_SECRET`
2. **Honeypot** — a `website` field positioned off-screen rather than
   `display:none`, which bots skip; a filled one is silently swallowed
3. **Rate limit** — 5 comments per IP per 10 minutes, IPs stored only as salted
   SHA-256 hashes

Comment bodies are rendered as **text nodes, never HTML**, so a comment cannot
inject markup or script.

### Secrets

```bash
npx wrangler secret put TURNSTILE_SECRET   # from the Turnstile widget
npx wrangler secret put ADMIN_TOKEN        # moderation password
```

Neither is in this repo. To test the comment flow without a real browser, swap in
Cloudflare's always-pass test keys (sitekey `1x00000000000000000000AA`, secret
`1x0000000000000000000000000000000AA`), then **restore the real ones**.

## Free-tier limits

Workers 100,000 requests/day. D1 5 GB storage, 5 M rows read/day, 100 k rows
written/day. One row written per counted view; the blog is far under this.

## Verify data

```bash
npx wrangler d1 execute blog-views --remote \
  --command="SELECT COUNT(*) posts, SUM(count) total FROM views;"   # 32 / 77528+
npx wrangler d1 execute blog-views --remote \
  --command="SELECT approved, COUNT(*) FROM comments GROUP BY approved;"
```

## Being told about new comments

There is no email or webhook notification: Cloudflare Email Sending is not
onboarded on this account (`wrangler email sending enable` returns Unauthorized
with the current OAuth token), so it needs a Dashboard step first.

Until then, subscribe a feed reader to:

```
https://views.khaledalam.net/admin/feed.xml?token=<ADMIN_TOKEN>
```

Pending comments appear as feed items, so the reader notifies you. The token is
in the query string because feed readers cannot send headers — treat that URL as
a secret. The `/admin` tab title also shows the pending count.
