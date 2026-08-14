# blog.khaledalam.net

Static blog, migrated off WordPress (DigitalOcean droplet) to **$0 hosting**:

| Concern | Solution | Cost |
|---|---|---|
| Hosting | GitHub Pages (this repo) + GitHub Actions | free |
| Site generator | [Astro](https://astro.build) — static HTML, RTL support | free |
| Post view counts | Cloudflare Worker + D1 (`counter/`), seeded with 77,516 existing views | free |
| Comments | self-hosted, same Worker + D1, held for approval (`counter/`) | free |
| RSS | `/feed.xml` (was `/feed` on WordPress) | free |

Post URLs are **identical** to the old WordPress permalinks (`/<slug>/`), so
SEO and backlinks are preserved. The 2 Arabic posts keep their exact URLs.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
```

## Content

Posts live in `src/data/posts.json` (migrated from WordPress via the REST API).
Each entry has the slug, title, SEO metadata, view seed, language/direction, and
the post body as HTML. Images are in `public/wp-content/uploads/...` at the same
paths WordPress used.

To add a post: append an object to `src/data/posts.json` and push. Actions
rebuilds and deploys.

## Backend services

Both live in [`counter/`](counter/README.md) as one Cloudflare Worker on D1:

1. **View counter** — live. A visit counts once per post per 10 minutes per
   browser; the index does a read-only batch fetch.
2. **Comments** — live. No GitHub account needed. Every comment is held for
   approval and is invisible to readers until approved at the Worker's `/admin`.

Set `COUNTER_URL` in `src/config.ts` to the Worker URL; leaving it empty disables
both (posts fall back to their static seeded counts and the comment form is
hidden).


## Backup

`backup/` holds the raw WordPress REST export (posts, pages, taxonomy, media
metadata, view counts) captured at migration time.
