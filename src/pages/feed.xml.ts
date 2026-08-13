import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import posts from '../data/posts.json';

// RSS at /feed.xml. The old WordPress feed lived at /feed — a Cloudflare
// redirect /feed -> /feed.xml (added during cutover) keeps old subscribers working.
export function GET(context: APIContext) {
  const site = context.site?.href ?? `${SITE.url}/`;
  const newest = posts
    .map((p) => new Date(p.modified || p.date).getTime())
    .sort((a, b) => b - a)[0];

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.slice(0, 30).map((p) => ({
      title: p.title,
      link: `/${p.slug}/`,
      pubDate: new Date(p.date),
      description: p.description,
      categories: [...p.categories, ...p.tags],
      author: SITE.author,
    })),
    // Description-only on purpose: full-text items get scraped and republished,
    // which competes with the canonical post in search results.
    customData: [
      `<language>en</language>`,
      `<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL('feed.xml', site).href}" rel="self" type="application/rss+xml" />`,
    ].join(''),
  });
}
