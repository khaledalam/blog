import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import posts from './src/data/posts.json' with { type: 'json' };

// Per-URL lastmod so crawlers re-fetch changed posts instead of guessing.
// Keys are the decoded pathnames the build emits (Arabic slugs included).
const lastmod = new Map(
  posts.map(p => [`/${decodeURIComponent(p.slug)}/`, new Date(p.modified || p.date).toISOString()]),
);
const newest = posts
  .map(p => new Date(p.modified || p.date).getTime())
  .sort((a, b) => b - a)[0];

// Static blog for blog.khaledalam.net — migrated off WordPress/DigitalOcean.
export default defineConfig({
  site: 'https://blog.khaledalam.net',
  trailingSlash: 'always',          // match WordPress permalinks: /<slug>/
  build: { format: 'directory' },   // emit /<slug>/index.html
  // Renamed posts: keep the old URLs working for backlinks.
  redirects: {
    '/from-prompt-engineers-to-brain-data-trainers-the-rise-of-eeg-fmri-slaves':
      '/from-prompt-engineers-to-brain-data-trainers-the-rise-of-neural-data-labor/',
  },
  integrations: [
    sitemap({
      filter: page => !page.includes('/404'),
      serialize(item) {
        const path = decodeURIComponent(new URL(item.url).pathname);
        if (path === '/') {
          item.lastmod = new Date(newest).toISOString();
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else if (lastmod.has(path)) {
          item.lastmod = lastmod.get(path);
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        return item;
      },
    }),
  ],
});
