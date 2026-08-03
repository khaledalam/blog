# blog.khaledalam.net

Static blog, migrated off WordPress (DigitalOcean droplet) to **$0 hosting**:

| Concern | Solution | Cost |
|---|---|---|
| Hosting | GitHub Pages (this repo) + GitHub Actions | free |
| Site generator | [Astro](https://astro.build) — static HTML, RTL support | free |
| Post view counts | Cloudflare Worker + KV (`counter/`), seeded with 77,516 existing views | free |
| Comments | [giscus](https://giscus.app) (GitHub Discussions) | free |
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

## The two services to finish wiring (one-time)

1. **View counter** — see [`counter/README.md`](counter/README.md). Deploy the
   Worker, then set `COUNTER_URL` in `src/config.ts`.
2. **Comments** — enable Discussions on this repo, install the giscus app at
   <https://giscus.app>, then fill `repoId` / `categoryId` in `src/config.ts`.

Both are optional — the site builds and works without them (counter shows the
static seeded count; comments section is hidden until configured).

## Backup

`backup/` holds the raw WordPress REST export (posts, pages, taxonomy, media
metadata, view counts) captured at migration time.
