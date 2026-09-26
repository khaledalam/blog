// Central config for the static blog.
// The two placeholders below are filled in once the Cloudflare Worker and the
// GitHub repo (with Discussions + giscus) exist. The site builds fine either way.

export const SITE = {
  title: 'Khaled Alam Blog',
  // The index <title>; post pages use each post's seoTitle.
  homeTitle: 'Khaled Alam Blog: PHP Internals, AI and Software Engineering',
  description:
    'Articles by Khaled Alam on PHP core and RFCs, Laravel and Symfony, React, AI and LLM tools, and the side projects he builds and ships.',
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
// Google Analytics 4 (blog.khaledalam.net property). Empty disables it.
export const GA_ID = 'G-4Z0H4Y76Y0';

export const COUNTER_URL = 'https://views.khaledalam.net';


// Self-hosted comments live in the same Cloudflare Worker as the view counter
// (COUNTER_URL above), backed by D1. No GitHub account is needed to comment.
//
// Every comment is stored as PENDING and is invisible to readers until it is
// approved at {COUNTER_URL}/admin — paste the admin token there (Worker secret
// ADMIN_TOKEN). Spam protection is Cloudflare Turnstile + a honeypot field +
// a per-IP rate limit of 5 comments per 10 minutes.
//
// The sitekey is public by design; the matching secret is the Worker secret
// TURNSTILE_SECRET and is never in this repo.
export const TURNSTILE_SITEKEY = '0x4AAAAAAEPjUuiZjC0s1BzH';
