// Pure helpers for Website Source Export (fetch/zip orchestration lives in sidepanel/source.ts).

/** Block non-http(s), loopback, private ranges, and cloud metadata (SSRF guard). */
export function isSafeUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const h = u.hostname.toLowerCase();
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal')
  )
    return false;
  if (h === '0.0.0.0' || h === '::1' || h === '[::1]') return false;
  if (h === '169.254.169.254') return false; // cloud metadata
  if (/^127\./.test(h)) return false;
  if (/^10\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false;
  return true;
}

/** A safe local filename derived from a URL's last path segment. */
export function sanitizeName(url: string, fallback: string): string {
  let base: string;
  try {
    base = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
  } catch {
    base = '';
  }
  base = (base.split(/[?#]/)[0] ?? '').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+/, '');
  return base || fallback;
}

/** Rewrite CSS url(...) references via a mapper; unmapped (null) refs are left as-is. */
export function rewriteCssUrls(css: string, map: (url: string) => string | null): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q: string, u: string) => {
    const local = map(u.trim());
    return local ? `url(${q}${local}${q})` : m;
  });
}

/** Extract absolute url() targets from a CSS string, resolved against baseUrl. */
export function cssUrlRefs(css: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const raw = (m[2] ?? '').trim();
    if (!raw || raw.startsWith('data:')) continue;
    try {
      out.push(new URL(raw, baseUrl).href);
    } catch {
      /* skip */
    }
  }
  return out;
}
