// Central config for the static blog.
// The two placeholders below are filled in once the Cloudflare Worker and the
// GitHub repo (with Discussions + giscus) exist. The site builds fine either way.

export const SITE = {
  title: 'Khaled Alam Blog',
  description: 'Software engineering, PHP internals, AI, and side projects by Khaled Alam.',
  url: 'https://blog.khaledalam.net',
  author: 'Khaled Alam',
  authorUrl: 'https://khaledalam.net',
};

// Cloudflare Worker that stores/returns per-post view counts (see /counter).
// Set to the deployed Worker URL, e.g. https://blog-views.<sub>.workers.dev
// Leave empty to disable the live counter (falls back to the static seed value).
export const COUNTER_URL = '';

// giscus (GitHub Discussions-backed comments). Fill after enabling Discussions
// on the repo and installing the giscus GitHub App: https://giscus.app
export const GISCUS = {
  repo: 'khaledalam/blog',
  repoId: 'R_kgDOTr9qUw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOTr9qU84DCjOl',
  mapping: 'pathname',
  reactionsEnabled: '1',
  theme: 'preferred_color_scheme',
};
// NOTE: comments render only after the giscus GitHub App is installed on this
// repo — install at https://github.com/apps/giscus (one-time, browser step).
