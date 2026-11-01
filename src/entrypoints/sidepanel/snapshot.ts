import { isSafeUrl, rewriteCssUrls, cssUrlRefs, pickSrcset } from '../../core/source-export';

export interface SnapshotSummary {
  inlined: number;
  skipped: number;
  bytes: number;
}

const TIMEOUT = 15000;
const PER_FILE_MAX = 3 * 1024 * 1024; // don't inline assets bigger than this
const TOTAL_MAX = 40 * 1024 * 1024;
const MAX_CSS_DEPTH = 2;

/** Build a self-contained, faithful HTML snapshot (inline CSS/images/fonts, scripts removed). */
export async function buildSnapshot(
  html: string,
  baseUrl: string,
  onProgress?: (label: string) => void,
): Promise<{ blob: Blob; summary: SnapshotSummary }> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const summary: SnapshotSummary = { inlined: 0, skipped: 0, bytes: 0 };
  const cache = new Map<string, string | null>();

  const absolute = (raw: string | null, base = baseUrl): string | null => {
    if (!raw || raw.startsWith('data:')) return null;
    try {
      return new URL(raw, base).href;
    } catch {
      return null;
    }
  };

  async function dataUrl(absUrl: string): Promise<string | null> {
    if (cache.has(absUrl)) return cache.get(absUrl)!;
    let result: string | null = null;
    if (isSafeUrl(absUrl) && summary.bytes < TOTAL_MAX) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), TIMEOUT);
      try {
        const r = await fetch(absUrl, { signal: ac.signal, credentials: 'omit' });
        if (r.ok) {
          const blob = await r.blob();
          if (blob.size <= PER_FILE_MAX) {
            result = await blobToDataUrl(blob);
            summary.bytes += blob.size;
            summary.inlined++;
          }
        }
      } catch {
        /* skip */
      } finally {
        clearTimeout(timer);
      }
    }
    if (result === null) summary.skipped++;
    cache.set(absUrl, result);
    return result;
  }

  async function inlineCss(cssText: string, cssBase: string, depth: number): Promise<string> {
    // resolve @import first
    if (depth < MAX_CSS_DEPTH) {
      for (const m of [...cssText.matchAll(/@import\s+(?:url\()?['"]?([^'")]+)['"]?\)?[^;]*;/g)]) {
        const imp = absolute(m[1] ?? '', cssBase);
        const inlined = imp ? await fetchText(imp) : null;
        cssText = cssText.replace(m[0], inlined ? await inlineCss(inlined, imp!, depth + 1) : '');
      }
    }
    // inline url() assets
    const map = new Map<string, string>();
    for (const ref of cssUrlRefs(cssText, cssBase)) {
      const d = await dataUrl(ref);
      if (d) map.set(ref, d);
    }
    return rewriteCssUrls(cssText, (u) => {
      const a = absolute(u, cssBase);
      return a && map.get(a) ? map.get(a)! : null;
    });
  }

  async function fetchText(absUrl: string): Promise<string | null> {
    if (!isSafeUrl(absUrl)) return null;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const r = await fetch(absUrl, { signal: ac.signal, credentials: 'omit' });
      return r.ok ? await r.text() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // 1. strip scripts + preloads; add a <base> safety net
  doc
    .querySelectorAll(
      'script, link[rel~="preload"], link[rel~="modulepreload"], link[rel~="prefetch"]',
    )
    .forEach((el) => el.remove());
  const base = doc.createElement('base');
  base.href = baseUrl;
  doc.head?.insertBefore(base, doc.head.firstChild);

  // 2. stylesheets -> inline <style>
  const links = [...doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')];
  for (let i = 0; i < links.length; i++) {
    const el = links[i]!;
    onProgress?.(`Inlining styles ${i + 1}/${links.length}…`);
    const href = absolute(el.getAttribute('href'));
    const css = href ? await fetchText(href) : null;
    if (css === null) continue;
    const style = doc.createElement('style');
    style.textContent = await inlineCss(css, href!, 0);
    el.replaceWith(style);
  }
  // inline <style> blocks' url()
  for (const style of [...doc.querySelectorAll('style')]) {
    if (style.textContent && style.textContent.includes('url(')) {
      style.textContent = await inlineCss(style.textContent, baseUrl, 0);
    }
  }

  // 3. images (+ srcset/lazy)
  const imgs = [...doc.querySelectorAll<HTMLImageElement>('img')];
  for (let i = 0; i < imgs.length; i++) {
    const el = imgs[i]!;
    onProgress?.(`Inlining images ${i + 1}/${imgs.length}…`);
    const pick = pickSrcset(
      el.getAttribute('srcset') || el.getAttribute('data-srcset'),
      el.getAttribute('src') || el.getAttribute('data-src'),
    );
    const a = absolute(pick);
    const d = a ? await dataUrl(a) : null;
    if (d) el.setAttribute('src', d);
    el.removeAttribute('srcset');
    el.removeAttribute('loading');
  }

  // 4. inline style="...url()..."
  for (const el of [...doc.querySelectorAll<HTMLElement>('[style*="url("]')]) {
    const s = el.getAttribute('style');
    if (s) el.setAttribute('style', await inlineCss(s, baseUrl, MAX_CSS_DEPTH));
  }

  // 5. favicon
  for (const el of [...doc.querySelectorAll<HTMLLinkElement>('link[rel~="icon"][href]')]) {
    const a = absolute(el.getAttribute('href'));
    const d = a ? await dataUrl(a) : null;
    if (d) el.setAttribute('href', d);
  }

  const out = '<!doctype html>\n' + doc.documentElement.outerHTML;
  return { blob: new Blob([out], { type: 'text/html' }), summary };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('read failed'));
    fr.readAsDataURL(blob);
  });
}
