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
export const COUNTER_URL = 'https://blog-views.blog-views.workers.dev';

// giscus (GitHub Discussions-backed comments), backed by GitHub Discussions on
// khaledalam/blog. Verified working: repo public, Discussions enabled, repoId
// and categoryId match the GitHub API, and the giscus GitHub App is installed.
//
// Threads are created lazily — giscus opens a discussion the first time someone
// comments on a post, so `{"error":"Discussion not found"}` from the giscus API
// is normal for a post nobody has commented on yet. The error to watch for is
// "giscus is not installed on this repository", which means the App was removed.
//
// Setting `enabled: false` swaps every post over to plain GitHub Discussions
// links instead (see components/Comments.astro) — a safe fallback if the App
// ever goes away.
export const GISCUS = {
  enabled: true,
  repo: 'khaledalam/blog',
  repoId: 'R_kgDOTr9qUw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOTr9qU84DCjOl',
  mapping: 'pathname',
  reactionsEnabled: '1',
  theme: 'preferred_color_scheme',
};
// The giscus App install is a one-time browser step at
// https://github.com/apps/giscus — done, and it must stay installed for
// comments to load.
