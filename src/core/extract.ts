import type { FontToken, PageStyles } from './messaging';

// shortcut: scans up to SCAN_CAP elements for perf on huge pages; raise/stream if palettes look thin on big sites.
const SCAN_CAP = 4000;
const MAX_COLORS = 17;
const MAX_FONTS = 8;

/** Scan a page's computed styles into a palette + font list + element count. */
export function extractPageStyles(doc: Document): PageStyles {
  const els = Array.from(doc.querySelectorAll<HTMLElement>('body *')).slice(0, SCAN_CAP);

  const colorCount = new Map<string, number>();
  const fonts = new Map<string, { weights: Set<number>; heading: boolean }>();

  for (const el of els) {
    const cs = getComputedStyle(el);
    bump(colorCount, toHex(cs.color));
    bump(colorCount, toHex(cs.backgroundColor));

    const fam = primaryFamily(cs.fontFamily);
    if (fam) {
      const entry = fonts.get(fam) ?? { weights: new Set<number>(), heading: false };
      const w = weightOf(cs.fontWeight);
      if (w !== null) entry.weights.add(w);
      if (/^H[1-6]$/.test(el.tagName)) entry.heading = true;
      fonts.set(fam, entry);
    }
  }

  const colors = [...colorCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COLORS)
    .map(([hex]) => hex);

  const fontTokens: FontToken[] = [...fonts.entries()].slice(0, MAX_FONTS).map(([name, info]) => ({
    name,
    role: info.heading ? 'Headings' : 'Body',
    css: `font-family: ${quoteFamily(name)}, sans-serif;`,
    tw: `font-['${name.replace(/\s+/g, '_')}']`,
    weights: [...info.weights].sort((a, b) => a - b),
  }));

  return { colors, fonts: fontTokens, elementCount: doc.querySelectorAll('*').length };
}

function bump(map: Map<string, number>, hex: string | null): void {
  if (hex) map.set(hex, (map.get(hex) ?? 0) + 1);
}

/** Parse a computed `rgb()/rgba()` color to lowercase hex; null for transparent/unparseable. */
export function toHex(color: string): string | null {
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m || m[1] === undefined) return null;
  const parts = m[1].split(',').map((p) => p.trim());
  const alpha = parts[3];
  if (alpha !== undefined && parseFloat(alpha) === 0) return null; // fully transparent
  const rgb = parts.slice(0, 3).map((n) => parseInt(n, 10));
  if (rgb.length < 3 || rgb.some((n) => Number.isNaN(n))) return null;
  return '#' + rgb.map((n) => clamp(n).toString(16).padStart(2, '0')).join('');
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

export function primaryFamily(fontFamily: string): string | null {
  const first = fontFamily
    .split(',')[0]
    ?.trim()
    .replace(/^["']|["']$/g, '');
  return first ? first : null;
}

export function quoteFamily(name: string): string {
  return /\s/.test(name) ? `'${name}'` : name;
}

export function weightOf(fw: string): number | null {
  if (fw === 'normal') return 400;
  if (fw === 'bold') return 700;
  const n = parseInt(fw, 10);
  return Number.isNaN(n) ? null : n;
}
