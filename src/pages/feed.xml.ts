import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import posts from '../data/posts.json';

// RSS at /feed.xml. The old WordPress feed lived at /feed — a Cloudflare
// redirect /feed -> /feed.xml (added during cutover) keeps old subscribers working.
export function GET(context: APIContext) {
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.slice(0, 30).map((p) => ({
      title: p.title,
      link: `/${p.slug}/`,
      pubDate: new Date(p.date),
      description: p.description,
    })),
    customData: `<language>en</language>`,
  });
}
