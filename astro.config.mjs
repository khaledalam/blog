import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static blog for blog.khaledalam.net — migrated off WordPress/DigitalOcean.
export default defineConfig({
  site: 'https://blog.khaledalam.net',
  trailingSlash: 'always',          // match WordPress permalinks: /<slug>/
  build: { format: 'directory' },   // emit /<slug>/index.html
  integrations: [sitemap()],
});
