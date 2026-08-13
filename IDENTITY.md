# Search identity — how "Khaled Alam" resolves in Google

Working notes for keeping the entity consistent across properties, so the next
change doesn't drift.

**Why this file lives in the blog repo.** It covers both sites, but it is kept
here deliberately: `khaledalam.github.io` is a plain GitHub Pages repo that
serves *every* file at its root, so a copy there was reachable at
`https://khaledalam.net/IDENTITY.md`. This repo publishes only `site/dist`, so
root files are version-controlled but never web-served (`README.md` 404s). Do
not move it back.

## The one rule

Google resolves people by matching the *same* strings and links across *many*
places. Every property below must agree, byte for byte:

| Field | Canonical value |
|---|---|
| Name | `Khaled Alam` |
| Name (ar) | `خالد علام` |
| Job title | `Software Specialist` |
| Photo | `https://khaledalam.net/DP_Khaled.jpg` |
| Home | `https://khaledalam.net` |
| Entity `@id` | `https://khaledalam.net/#person` |

The `@id` is the important one: khaledalam.net and blog.khaledalam.net both emit
JSON-LD using that identical `@id`, so the two sites describe **one** person
rather than two people with the same name. If a third property is ever added,
reuse that `@id` verbatim.

Source of truth for the blog: `PERSON` in `blog-migration/site/src/config.ts`.
Source of truth for this site: the `@graph` block in `index.html`.

## Status

| Property | State |
|---|---|
| khaledalam.net | ✅ `WebSite` + `ProfilePage` + `Person`, shared `@id` |
| blog.khaledalam.net | ✅ `WebSite` + `Person` on all 33 pages, `BlogPosting` + breadcrumbs on all 32 posts, `Blog` + `ItemList` on the index |
| Reciprocal links | ✅ each site links to the other in nav and footer |
| Sitemaps + robots | ✅ both sites |
| GitHub | ⚠️ bio empty — see below |
| LinkedIn / X / YouTube | ⚠️ unverified, headline likely still "Software Engineer" |
| Wikidata | ❌ not created — draft below |

## Manual fixes (I can't edit these)

1. **GitHub bio is empty.** It should read `Software Specialist` and nothing
   else. GitHub's bio is one of the strongest `sameAs` corroborations Google
   has, and right now it corroborates nothing. Profile links should also
   include `https://blog.khaledalam.net`.
2. **LinkedIn headline** — set to `Software Specialist`. Any property still
   saying "Software Engineer · Ex-CTO & Founder" actively splits the entity.
3. **X and YouTube** — same name string, same photo, link to khaledalam.net.
4. **Use the same photo everywhere.** Different photos per profile weakens
   matching; `DP_Khaled.jpg` should be it.

## Wikidata draft

Wikidata's bar is *identifiability with sources*, not Wikipedia's
"significant coverage in independent secondary sources". It is the realistic
structured anchor, and it is a direct input to Google's Knowledge Graph.

Create at <https://www.wikidata.org/wiki/Special:NewItem>. Disclose the
conflict of interest on the item's talk page — it is permitted on Wikidata and
being upfront prevents it being treated as covert self-promotion.

**Label (en):** Khaled Alam
**Label (ar):** خالد علام
**Description (en):** software engineer and PHP core contributor
**Description (ar):** مهندس برمجيات ومساهم في نواة PHP

> Keep the description generic and occupation-like. Wikidata descriptions are
> disambiguators, not job titles; "Software Specialist" is a self-chosen title
> and reads as promotional there.

| Property | Value | Reference |
|---|---|---|
| `P31` instance of | human | — |
| `P106` occupation | software engineer (Q82594) | — |
| `P856` official website | https://khaledalam.net | — |
| `P2037` GitHub username | khaledalam | https://github.com/khaledalam |
| `P6634` LinkedIn personal profile ID | khaledalam | https://linkedin.com/in/khaledalam |
| `P2002` X username | KhaledAlamXYZ | — |
| `P2397` YouTube channel ID | NinjoCoding | — |
| `P1416` affiliation / `P800` notable work | PHP (Q59) — RFC author | https://wiki.php.net/rfc/const_object_property_write |

**Strongest citation available.** The RFC page on the official PHP wiki names
the author and records the outcome — verified 13 Aug 2026:

- Title: *Allow Object Property Writes on Objects Referenced by Constants*
- Author: Khaled Alam
- Status: **Implemented in PHP 8.6**
- Vote: 17 yes / 2 no / 6 abstain (two-thirds threshold required)
- Merged: `b16cab7da8e5748b173542da42fc8b602ae59dea`, php-src, 13 Aug 2026

Expect the item to be challenged for notability regardless. If it is deleted,
that is survivable — unlike a deleted Wikipedia article, a deleted Wikidata
item does not leave an indexed page arguing you are not notable.

## Independent coverage (running log)

Everything above this line is self-published. This section is the only part that
counts toward notability, so it is tracked separately as it accumulates.

1. **php-internals weekly video roundup**, 5 Aug 2026 — an Artisan Build
   production, covering the mailing list for 29 Jul–4 Aug 2026.
   <https://www.youtube.com/watch?v=8YUc-A2h-f4>
   Lists under "Live Ballots": *"Const Object Property Writes (Khaled Alam) —
   closes Sat Aug 8, 23:59 UTC. 14–2–6 as of recording."*
   Independently corroborates authorship, the ballot close date, and the
   in-progress tally that finished at 17–2–6.

## Wikipedia — deliberately not attempted

Wikipedia needs multiple reliable, **independent, secondary** sources *about
the person*. php.net, GitHub, and this blog are all primary or self-published
and count for nothing toward that bar. Writing it yourself is additionally
against `WP:AUTOBIO` / `WP:COI`.

The practical risk is the real argument: an article on a subject below the bar
gets deleted, and the deletion discussion becomes a permanently indexed page
carrying the phrase "not notable" next to the name. That is a materially worse
search result than no article at all.

The video logged above is the right *kind* of source — independent, names the
author — but it is one item, it is a YouTube channel rather than an outlet with
an established editorial reputation, and it covers **the RFC**, not the person.
Wikipedia's bar is coverage *about the subject*, which is a different thing
again. Treat it as a strong search result and the first entry in a log, not as
evidence the bar is met.

What *would* legitimately move this, none of it self-authored:

- PHP 8.6 release coverage. `UPGRADING` and `NEWS` in php-src will carry the
  change; PHP Watch, JetBrains' *PHP Annotated Monthly*, and Laravel News
  routinely cover new-version features and credit RFC authors by name. The
  8.6 release cycle (beta 1 was 13 Aug 2026, RC 1 hard freeze 22 Sep 2026) is
  when that coverage lands — worth watching for and logging above.
- Conference talks and podcast appearances — independently published, and they
  generate exactly the secondary sources that are missing today.

One Wikipedia edit *is* appropriate: adding the **feature** to the PHP article's
version-history section, cited to the RFC. That is ordinary editing about the
language. Adding **yourself** is the conflict of interest.
