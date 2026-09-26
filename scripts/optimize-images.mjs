// Writes compressed WebP copies of every image the posts use, next to nothing
// else: public/_img/<original path>.webp (max 1440px wide, for the article) and
// public/_img/<original path>.thumb.webp (480px, for post cards). The originals
// stay where WordPress put them so old image URLs and og:image keep working.
//
// Run after adding a post with new images:  node scripts/optimize-images.mjs
// Outputs are committed; the build only reads them (src/lib/images.ts).
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

const posts = JSON.parse(readFileSync('src/data/posts.json', 'utf8'));
const srcs = new Set();
for (const p of posts) {
  if (p.hero) srcs.add(p.hero);
  for (const m of p.html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) srcs.add(m[1]);
}

let before = 0;
let after = 0;
for (const src of srcs) {
  if (!src.startsWith('/') || !/\.(png|jpe?g|webp)$/i.test(src)) continue;
  const input = `public${src}`;
  if (!existsSync(input)) continue;
  for (const [suffix, width] of [['.webp', 1440], ['.thumb.webp', 480]]) {
    const out = `public/_img${src}${suffix}`;
    if (!existsSync(out)) {
      mkdirSync(dirname(out), { recursive: true });
      await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    }
    if (suffix === '.webp') {
      before += statSync(input).size;
      after += statSync(out).size;
    }
  }
}
console.log(`${srcs.size} images: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
