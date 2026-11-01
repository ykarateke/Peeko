import type { DesignTokens, TypeStyle } from './messaging';
import { toHex, primaryFamily, weightOf } from './extract';

const NOISE = new Set(['', 'none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', 'transparent', '0px']);

// shortcut: scans up to SCAN_CAP elements; same-origin stylesheets only for breakpoints (CORS blocks the rest).
const SCAN_CAP = 4000;

/** Extract a design-token set (colors, typography, spacing, radii, shadows, gradients, breakpoints) from a page. */
export function extractTokens(doc: Document): DesignTokens {
  const els = Array.from(doc.querySelectorAll<HTMLElement>('body *')).slice(0, SCAN_CAP);

  const colorCount = new Map<string, number>();
  const families = new Set<string>();
  const sizes = new Set<number>();
  const weights = new Set<number>();
  const lineHeights = new Set<string>();
  const spacing = new Set<number>();
  const radii = new Set<string>();
  const shadows = new Set<string>();
  const gradients = new Set<string>();
  const containers = new Map<string, number>();
  const durations = new Set<string>();
  const easings = new Set<string>();

  const addColor = (c: string) => {
    const h = toHex(c);
    if (h) colorCount.set(h, (colorCount.get(h) ?? 0) + 1);
  };
  const addSpacing = (v: string) => {
    const n = pxNum(v);
    if (n !== null && n > 0 && n <= 256) spacing.add(n);
  };

  for (const el of els) {
    const cs = getComputedStyle(el);
    addColor(cs.color);
    addColor(cs.backgroundColor);

    const fam = primaryFamily(cs.fontFamily);
    if (fam) families.add(fam);
    const fs = pxNum(cs.fontSize);
    if (fs !== null) sizes.add(fs);
    const w = weightOf(cs.fontWeight);
    if (w !== null) weights.add(w);
    if (cs.lineHeight && cs.lineHeight !== 'normal') lineHeights.add(cs.lineHeight);

    for (const p of [
      cs.paddingTop,
      cs.paddingRight,
      cs.paddingBottom,
      cs.paddingLeft,
      cs.marginTop,
      cs.marginRight,
      cs.marginBottom,
      cs.marginLeft,
      cs.rowGap,
      cs.columnGap,
    ]) {
      addSpacing(p);
    }

    if (cs.borderRadius && cs.borderRadius !== '0px') radii.add(cs.borderRadius);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
    if (cs.backgroundImage.includes('gradient(')) gradients.add(cs.backgroundImage);

    const mw = pxNum(cs.maxWidth);
    if (mw !== null && mw >= 320 && mw <= 2000) containers.set(cs.maxWidth, (containers.get(cs.maxWidth) ?? 0) + 1);

    let hasDuration = false;
    for (const d of cs.transitionDuration.split(',')) {
      const v = d.trim();
      if (v && v !== '0s') {
        durations.add(v);
        hasDuration = true;
      }
    }
    if (hasDuration) {
      for (const e of cs.transitionTimingFunction.split(',')) {
        const v = e.trim();
        if (v) easings.add(v);
      }
    }
  }

  const colors = [...colorCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([hex]) => hex);

  const spacingPx = [...spacing].sort((a, b) => a - b).slice(0, 14).map((n) => `${n}px`);

  return {
    colors,
    roles: detectRoles(doc),
    fontFamilies: [...families].slice(0, 8),
    fontSizes: [...sizes].sort((a, b) => a - b).map((n) => `${n}px`),
    fontWeights: [...weights].sort((a, b) => a - b),
    lineHeights: [...lineHeights].slice(0, 10),
    spacing: spacingPx,
    radii: [...radii].slice(0, 10),
    shadows: [...shadows].slice(0, 10),
    gradients: [...gradients].slice(0, 10),
    breakpoints: extractBreakpoints(doc),
    containers: [...containers.keys()]
      .sort((a, b) => (pxNum(a) ?? 0) - (pxNum(b) ?? 0))
      .slice(0, 6),
    durations: [...durations].sort((a, b) => msOf(a) - msOf(b)).slice(0, 8),
    easings: [...easings].slice(0, 8),
    headings: detectHeadings(doc),
    body: detectBody(doc),
    bodyColor: doc.body ? toHex(getComputedStyle(doc.body).color) : null,
    components: detectComponents(doc),
    baseUnit: spacingPx[0] ?? null,
    meta: {
      url: location.href,
      title: doc.title,
      elementCount: doc.querySelectorAll('*').length,
      generatedAt: new Date().toISOString(),
    },
  };
}

function detectRoles(doc: Document): Record<string, string> {
  const roles: Record<string, string> = {};
  const set = (key: string, color: string | null | undefined) => {
    if (!color) return;
    const h = toHex(color);
    if (h) roles[key] = h;
  };
  if (doc.body) {
    const cs = getComputedStyle(doc.body);
    set('background', cs.backgroundColor);
    set('text', cs.color);
  }
  const link = doc.querySelector('a');
  if (link) set('link', getComputedStyle(link).color);
  const heading = doc.querySelector('h1');
  if (heading) set('heading', getComputedStyle(heading).color);
  const button = doc.querySelector('button, .btn, [type="submit"]');
  if (button) set('accent', getComputedStyle(button).backgroundColor);
  return roles;
}

function detectHeadings(doc: Document): Record<string, TypeStyle> {
  const out: Record<string, TypeStyle> = {};
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const el = doc.querySelector(tag);
    if (el) out[tag] = typeStyle(el);
  }
  return out;
}

function detectBody(doc: Document): TypeStyle | null {
  return doc.body ? typeStyle(doc.body) : null;
}

function typeStyle(el: Element): TypeStyle {
  const cs = getComputedStyle(el);
  return { size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight };
}

function detectComponents(doc: Document): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const btn = doc.querySelector('button, .btn, [type="submit"], [role="button"]');
  if (btn)
    out.button = cleanStyle(btn, [
      'background-color',
      'color',
      'border',
      'border-radius',
      'padding',
      'font-size',
      'font-weight',
    ]);
  const link = doc.querySelector('a[href]');
  if (link) out.link = cleanStyle(link, ['color', 'text-decoration-line', 'font-weight']);
  const input = doc.querySelector('input:not([type="hidden"]), textarea, select');
  if (input)
    out.input = cleanStyle(input, [
      'background-color',
      'color',
      'border',
      'border-radius',
      'padding',
      'font-size',
    ]);
  return out;
}

/** Read selected computed properties, dropping noise and hexifying color values. */
function cleanStyle(el: Element, props: string[]): Record<string, string> {
  const cs = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const p of props) {
    let v =
      p === 'border'
        ? synthBorder(cs)
        : cs.getPropertyValue(p).trim();
    if (!v || NOISE.has(v)) continue;
    if ((p === 'color' || p === 'background-color') && v.startsWith('rgb')) v = toHex(v) ?? v;
    out[p] = v;
  }
  return out;
}

function synthBorder(cs: CSSStyleDeclaration): string {
  const w = cs.getPropertyValue('border-top-width');
  const style = cs.getPropertyValue('border-top-style');
  const color = cs.getPropertyValue('border-top-color');
  if (style === 'none' || w === '0px') return '';
  const hex = toHex(color) ?? color;
  return `${w} ${style} ${hex}`;
}

function extractBreakpoints(doc: Document): string[] {
  const bps = new Set<number>();
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin stylesheet
    }
    collectMedia(rules, bps);
  }
  return [...bps].sort((a, b) => a - b).map((n) => `${n}px`);
}

function collectMedia(rules: CSSRuleList, out: Set<number>): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      for (const m of rule.media.mediaText.matchAll(/(?:min|max)-width:\s*(\d+(?:\.\d+)?)px/gi)) {
        const n = parseFloat(m[1] ?? '');
        if (!Number.isNaN(n)) out.add(n);
      }
      collectMedia(rule.cssRules, out);
    }
  }
}

function pxNum(v: string): number | null {
  const m = v.match(/^(-?\d+(?:\.\d+)?)px$/);
  return m && m[1] !== undefined ? parseFloat(m[1]) : null;
}

function msOf(v: string): number {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return 0;
  return v.trim().endsWith('ms') ? n : n * 1000;
}
