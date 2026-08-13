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

// Canonical identity for structured data. The @id is deliberately a
// khaledalam.net URL and is reused verbatim in the JSON-LD on khaledalam.net,
// so both sites describe ONE entity rather than two similarly-named people.
// Keep name / jobTitle / image / sameAs byte-identical across both sites.
export const PERSON = {
  '@type': 'Person',
  '@id': 'https://khaledalam.net/#person',
  name: 'Khaled Alam',
  alternateName: 'خالد علام',
  url: 'https://khaledalam.net',
  image: 'https://khaledalam.net/DP_Khaled.jpg',
  jobTitle: 'Software Specialist',
  sameAs: [
    'https://github.com/khaledalam',
    'https://linkedin.com/in/khaledalam',
    'https://twitter.com/KhaledAlamXYZ',
    'https://www.youtube.com/NinjoCoding',
    'https://blog.khaledalam.net',
  ],
};

// Cloudflare Worker that stores/returns per-post view counts (see /counter).
// Set to the deployed Worker URL, e.g. https://blog-views.<sub>.workers.dev
// Leave empty to disable the live counter (falls back to the static seed value).
export const COUNTER_URL = '';

// giscus (GitHub Discussions-backed comments). Fill after enabling Discussions
// on the repo and installing the giscus GitHub App: https://giscus.app
//
// `enabled` is the last switch to flip. Everything else below is already
// correct and verified against the GitHub API (repo public, Discussions on,
// repoId and categoryId both match). The only remaining step is installing the
// giscus GitHub App on khaledalam/blog — a browser-only authorization at
// https://github.com/apps/giscus that cannot be done from the CLI.
//
// Until that app is installed, giscus answers every request with
//   {"error":"giscus is not installed on this repository"}
// and renders that as a visible error box on all 32 post pages. So this stays
// false: no comments section is better than a broken one. Flip to true and push
// once the app is installed.
export const GISCUS = {
  enabled: false,
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
