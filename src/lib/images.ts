// Build-time image helpers. Post bodies are raw HTML from WordPress, so images
// are rewritten here: real width/height (no layout shift), lazy loading, and the
// WebP copies made by scripts/optimize-images.mjs when they exist.
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const dims = new Map<string, { w: number; h: number } | null>();

/** Intrinsic size of a file under public/, or null for external/unknown images. */
export async function size(src: string) {
  if (!dims.has(src)) {
    let d = null;
    if (src.startsWith('/') && existsSync(`public${decodeURI(src)}`)) {
      try {
        const m = await sharp(`public${decodeURI(src)}`).metadata();
        if (m.width && m.height) d = { w: m.width, h: m.height };
      } catch {}
    }
    dims.set(src, d);
  }
  return dims.get(src)!;
}

/** The optimized WebP for an original image, if one was generated. */
export function webp(src: string, thumb = false) {
  const out = `/_img${src}${thumb ? '.thumb.webp' : '.webp'}`;
  return src.startsWith('/') && existsSync(`public${decodeURI(out)}`) ? out : null;
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/**
 * Rewrites a post body: drops the first figure/image that repeats the hero shown
 * above the body, then gives every image dimensions, lazy loading and a WebP source.
 */
export async function rewriteBody(html: string, hero?: string | null) {
  if (hero) {
    // WordPress often embeds a resized copy (name-1024x576.png) of the hero, so compare base names.
    const base = (src: string) => src.replace(/-\d+x\d+(?=\.\w+$)/, '').replace(/\.\w+$/, '');
    const dup = [...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"[^>]*>/g)].find(m => base(m[1]) === base(hero));
    if (dup) {
      const figs = [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)];
      const fig = figs.find(f => f.index! <= dup.index! && dup.index! < f.index! + f[0].length);
      html = fig ? html.replace(fig[0], '') : html.replace(dup[0], '');
    }
  }
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  const out = new Map<string, string>();
  for (const tag of new Set(tags)) {
    const src = attr(tag, 'src');
    if (!src) continue;
    let t = tag.replace(/\s(loading|decoding)="[^"]*"/g, '');
    const d = await size(src);
    if (d && !attr(t, 'width')) t = t.replace(/^<img/, `<img width="${d.w}" height="${d.h}"`);
    t = t.replace(/^<img/, '<img loading="lazy" decoding="async"');
    const w = webp(src);
    out.set(tag, w ? `<picture><source srcset="${w}" type="image/webp">${t}</picture>` : t);
  }
  return html.replace(/<img\b[^>]*>/g, tag => out.get(tag) ?? tag);
}
