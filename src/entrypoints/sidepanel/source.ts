import { isSafeUrl, sanitizeName, rewriteCssUrls, cssUrlRefs } from '../../core/source-export';

export interface SourceSummary {
  files: number;
  failed: number;
  bytes: number;
  successRate: number;
}

type AType = 'css' | 'js' | 'image' | 'font' | 'other';
const FOLDER: Record<AType, string> = {
  css: 'css',
  js: 'js',
  image: 'assets',
  font: 'assets',
  other: 'assets',
};

const PER_FILE_TIMEOUT = 15000;
const MAX_FILES = 300;
const MAX_TOTAL = 60 * 1024 * 1024;
const MAX_CSS_ASSETS = 50;

const absolute = (raw: string | null, base: string): string | null => {
  if (!raw) return null;
  try {
    return new URL(raw, base).href;
  } catch {
    return null;
  }
};

/** Relative path from one zip file to another (both rooted in the zip). */
function relFrom(fromPath: string, toPath: string): string {
  const fromDir = fromPath.split('/').slice(0, -1).join('/');
  return fromDir && toPath.startsWith(fromDir + '/')
    ? toPath.slice(fromDir.length + 1)
    : '../' + toPath;
}

async function fetchBuf(url: string): Promise<ArrayBuffer | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), PER_FILE_TIMEOUT);
    try {
      const r = await fetch(url, { signal: ac.signal, credentials: 'omit' });
      clearTimeout(timer);
      if (!r.ok) return null;
      return await r.arrayBuffer();
    } catch {
      clearTimeout(timer);
    }
  }
  return null;
}

/** Download the page's accessible frontend files into a localized ZIP. */
export async function exportSource(
  html: string,
  baseUrl: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; summary: SourceSummary }> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const localByUrl = new Map<string, string>();
  const used = new Set<string>();
  const manifest: {
    local: string;
    url: string;
    type: AType;
    bytes: number;
    status: 'ok' | 'failed';
  }[] = [];
  let bytes = 0;
  let done = 0;

  const planLocal = (absUrl: string, type: AType): string => {
    const existing = localByUrl.get(absUrl);
    if (existing) return existing;
    const name = sanitizeName(absUrl, `file-${used.size + 1}`);
    let path = `${FOLDER[type]}/${name}`;
    let n = 1;
    while (used.has(path)) {
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      path = `${FOLDER[type]}/${base}-${n}${ext}`;
      n++;
    }
    used.add(path);
    localByUrl.set(absUrl, path);
    return path;
  };

  type Ref = { absUrl: string; type: AType; apply: (local: string) => void };
  const refs: Ref[] = [];
  const addRef = (raw: string | null, type: AType, apply: (local: string) => void) => {
    const a = absolute(raw, baseUrl);
    if (a && isSafeUrl(a)) refs.push({ absUrl: a, type, apply });
  };

  doc
    .querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')
    .forEach((el) => addRef(el.getAttribute('href'), 'css', (l) => el.setAttribute('href', l)));
  doc
    .querySelectorAll<HTMLScriptElement>('script[src]')
    .forEach((el) => addRef(el.getAttribute('src'), 'js', (l) => el.setAttribute('src', l)));
  doc.querySelectorAll<HTMLImageElement>('img[src]').forEach((el) => {
    addRef(el.getAttribute('src'), 'image', (l) => el.setAttribute('src', l));
    el.removeAttribute('srcset'); // avoid dangling responsive refs
  });
  doc
    .querySelectorAll<HTMLLinkElement>('link[rel~="icon"][href]')
    .forEach((el) => addRef(el.getAttribute('href'), 'image', (l) => el.setAttribute('href', l)));

  const capped = refs.slice(0, MAX_FILES);
  const total = capped.length;
  const cssToProcess: { path: string; url: string; buf: ArrayBuffer }[] = [];

  for (const ref of capped) {
    const buf = bytes >= MAX_TOTAL ? null : await fetchBuf(ref.absUrl);
    done++;
    onProgress?.(done, total);
    if (!buf) {
      manifest.push({ local: '', url: ref.absUrl, type: ref.type, bytes: 0, status: 'failed' });
      continue;
    }
    const local = planLocal(ref.absUrl, ref.type);
    bytes += buf.byteLength;
    if (ref.type === 'css') cssToProcess.push({ path: local, url: ref.absUrl, buf });
    else zip.file(local, buf);
    ref.apply(local); // HTML lives at the zip root → path is already relative to it
    manifest.push({ local, url: ref.absUrl, type: ref.type, bytes: buf.byteLength, status: 'ok' });
  }

  for (const css of cssToProcess) {
    let text = new TextDecoder().decode(css.buf);
    for (const au of cssUrlRefs(text, css.url).filter(isSafeUrl).slice(0, MAX_CSS_ASSETS)) {
      if (localByUrl.get(au) || bytes >= MAX_TOTAL) continue;
      const b = await fetchBuf(au);
      if (!b) {
        manifest.push({ local: '', url: au, type: 'other', bytes: 0, status: 'failed' });
        continue;
      }
      const type: AType = /\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(au) ? 'font' : 'image';
      const local = planLocal(au, type);
      bytes += b.byteLength;
      zip.file(local, b);
      manifest.push({ local, url: au, type, bytes: b.byteLength, status: 'ok' });
    }
    text = rewriteCssUrls(text, (u) => {
      const a = absolute(u, css.url);
      const l = a ? localByUrl.get(a) : undefined;
      return l ? relFrom(css.path, l) : null;
    });
    zip.file(css.path, text);
  }

  zip.file('index.html', '<!doctype html>\n' + doc.documentElement.outerHTML);

  const ok = manifest.filter((f) => f.status === 'ok').length;
  const summary: SourceSummary = {
    files: ok,
    failed: manifest.length - ok,
    bytes,
    successRate: manifest.length ? Math.round((ok / manifest.length) * 100) : 100,
  };
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        page: baseUrl,
        generatedAt: new Date().toISOString(),
        note: 'Exported by Peeko. Original source may not be fully retrievable; cross-origin/blocked resources are omitted.',
        summary,
        files: manifest,
      },
      null,
      2,
    ),
  );

  return { blob: await zip.generateAsync({ type: 'blob' }), summary };
}
