import type { Asset, AssetType } from './messaging';

// shortcut: top-frame only; cross-origin iframe assets aren't reachable anyway. Caps below bound huge pages.
const SCAN_CAP = 4000; // elements scanned for background-image
const INLINE_SVG_CAP = 60;
const TOTAL_CAP = 400;

const SVG_RE = /\.svg(\?|#|$)/i;
const URL_IN_CSS = /url\((['"]?)(.*?)\1\)/g;

/** Collect downloadable assets (images, SVG, icons, video, Lottie, fonts) from a page. */
export function extractAssets(doc: Document): Asset[] {
  const out: Asset[] = [];
  const seen = new Set<string>();

  const abs = (u: string): string | null => {
    try {
      return new URL(u, doc.baseURI).href;
    } catch {
      return null;
    }
  };
  const push = (type: AssetType, rawUrl: string | null, meta?: string): void => {
    if (!rawUrl || out.length >= TOTAL_CAP) return;
    const key = `${type}|${rawUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, url: rawUrl, name: nameFromUrl(rawUrl), meta });
  };

  // <img>
  doc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const u = abs(img.currentSrc || img.getAttribute('src') || '');
    if (!u) return;
    const meta = img.naturalWidth ? `${img.naturalWidth}×${img.naturalHeight}` : undefined;
    push(SVG_RE.test(u) ? 'svg' : 'image', u, meta);
  });

  // <source srcset> / <img srcset>
  doc.querySelectorAll<HTMLSourceElement>('source[srcset], img[srcset]').forEach((el) => {
    for (const cand of (el.getAttribute('srcset') || '').split(',')) {
      const u = abs(cand.trim().split(/\s+/)[0] || '');
      if (u) push(SVG_RE.test(u) ? 'svg' : 'image', u);
    }
  });

  // CSS background-image
  Array.from(doc.querySelectorAll<HTMLElement>('body *'))
    .slice(0, SCAN_CAP)
    .forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      for (const m of bg.matchAll(URL_IN_CSS)) {
        const u = abs(m[2] || '');
        if (u) push(SVG_RE.test(u) ? 'svg' : 'image', u);
      }
    });

  // inline <svg>
  const serializer = new XMLSerializer();
  Array.from(doc.querySelectorAll('svg'))
    .slice(0, INLINE_SVG_CAP)
    .forEach((svg, i) => {
      const xml = serializer.serializeToString(svg);
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      const w = svg.getAttribute('width');
      push('svg', url, w ? `${w}px` : 'inline');
      // name the inline ones predictably
      const last = out[out.length - 1];
      if (last && last.url === url) last.name = `inline-${i + 1}.svg`;
    });

  // icons
  doc
    .querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]',
    )
    .forEach((l) => push('icon', l.href ? abs(l.href) : null));

  // video
  doc.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
    push('video', abs(v.currentSrc || v.getAttribute('src') || ''));
    v.querySelectorAll('source').forEach((s) => push('video', s.src ? abs(s.src) : null));
    const poster = v.getAttribute('poster');
    if (poster) push('image', abs(poster), 'poster');
  });

  // lottie
  doc
    .querySelectorAll('lottie-player[src], dotlottie-player[src]')
    .forEach((el) => push('lottie', abs(el.getAttribute('src') || '')));

  // fonts (from same-origin stylesheets)
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin stylesheet — not readable
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const src = rule.style.getPropertyValue('src');
        for (const m of src.matchAll(URL_IN_CSS)) {
          const u = abs(m[2] || '');
          if (u) push('font', u, fontFormat(u));
        }
      }
    }
  }

  return out;
}

function nameFromUrl(u: string): string {
  if (u.startsWith('data:')) return 'inline';
  try {
    const path = new URL(u).pathname;
    const name = path.slice(path.lastIndexOf('/') + 1);
    return decodeURIComponent(name) || u;
  } catch {
    return u;
  }
}

function fontFormat(u: string): string | undefined {
  const m = u.match(/\.(woff2?|ttf|otf|eot)(\?|#|$)/i);
  return m ? m[1]!.toUpperCase() : undefined;
}
