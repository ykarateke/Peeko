import type { ColorToken, DesignTokens, TypeStyle, TypeStyleToken } from './messaging';
import { toHex, primaryFamily, weightOf } from './extract';
import { contrastRatio, formatColor, hslParts, colorDistance } from './color';
import { classifyColor, normalizeSpacing, designStyle, consistencyScore } from './classify';

const NOISE = new Set(['', 'none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', 'transparent', '0px']);

// shortcut: scans up to SCAN_CAP elements; same-origin stylesheets only for breakpoints (CORS blocks the rest).
const SCAN_CAP = 4000;

/** Extract a design-token set (colors, typography, spacing, radii, shadows, gradients, breakpoints) from a page. */
export function extractTokens(doc: Document): DesignTokens {
  const els = Array.from(doc.querySelectorAll<HTMLElement>('body *')).slice(0, SCAN_CAP);

  const colorCount = new Map<string, number>();
  const families = new Set<string>();
  const sizes = new Map<number, number>();
  const weights = new Set<number>();
  const lineHeights = new Set<string>();
  const spacing = new Map<number, number>();
  const radii = new Set<string>();
  const shadows = new Set<string>();
  const gradients = new Set<string>();
  const durations = new Set<string>();
  const easings = new Set<string>();

  const addColor = (c: string) => {
    const h = toHex(c);
    if (h) colorCount.set(h, (colorCount.get(h) ?? 0) + 1);
  };
  const addSpacing = (v: string) => {
    const n = pxNum(v);
    if (n !== null && n > 0 && n <= 256) spacing.set(n, (spacing.get(n) ?? 0) + 1);
  };

  for (const el of els) {
    const cs = getComputedStyle(el);
    addColor(cs.color);
    addColor(cs.backgroundColor);

    const fam = primaryFamily(cs.fontFamily);
    if (fam) families.add(fam);
    const fs = pxNum(cs.fontSize);
    if (fs !== null) sizes.set(fs, (sizes.get(fs) ?? 0) + 1);
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

    collectMotion(cs.transitionDuration, cs.transitionTimingFunction, durations, easings);
    collectMotion(cs.animationDuration, cs.animationTimingFunction, durations, easings);
  }

  const colorUsage = [...colorCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([value, count]) => ({ value, count }));
  const colors = colorUsage.map((c) => c.value);

  const sizeUsage = [...sizes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, count]) => ({ value: `${n}px`, count }));

  const spacingUsage = [...spacing.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 14)
    .map(([n, count]) => ({ value: `${n}px`, count }));

  const roles = detectRoles(doc);
  const radiiList = [...radii].slice(0, 10);
  const shadowList = [...shadows].slice(0, 10);
  const fontFamilies = [...families].slice(0, 8);
  const fontSizes = sizeUsage.map((s) => s.value);
  const spacingList = spacingUsage.map((s) => s.value);
  const headings = detectHeadings(doc);
  const body = detectBody(doc);
  const components = detectComponents(doc);

  const colorTokens = buildColorTokens(colorUsage, roles);
  const textStyles = buildTextStyles(headings, body, fontSizes, components);
  const spacingNormalized = normalizeSpacing(spacingList);

  const style = designStyle({ radii: radiiList, shadows: shadowList, colors, fontFamilies });
  const tokenCount =
    colorTokens.length +
    textStyles.length +
    spacingList.length +
    radiiList.length +
    shadowList.length;

  return {
    colors,
    roles,
    fontFamilies,
    fontSizes,
    fontWeights: [...weights].sort((a, b) => a - b),
    lineHeights: [...lineHeights].slice(0, 10),
    spacing: spacingList,
    radii: radiiList,
    shadows: shadowList,
    gradients: [...gradients].slice(0, 10),
    breakpoints: extractBreakpoints(doc),
    containers: detectContainers(doc),
    durations: [...durations].sort((a, b) => msOf(a) - msOf(b)).slice(0, 8),
    easings: [...easings].slice(0, 8),
    animations: extractKeyframes(doc),
    headings,
    body,
    bodyColor: doc.body ? toHex(getComputedStyle(doc.body).color) : null,
    components,
    baseUnit: spacingUsage[0]?.value ?? null,
    usage: { colors: colorUsage, fontSizes: sizeUsage, spacing: spacingUsage },
    colorTokens,
    textStyles,
    spacingNormalized,
    overview: {
      style: { label: style.label, confidence: style.confidence },
      consistencyScore: consistencyScore({
        colors: colors.length,
        fontSizes: fontSizes.length,
        spacing: spacingList.length,
        radii: radiiList.length,
      }),
      characteristics: style.characteristics,
      counts: {
        colors: colorTokens.length,
        typography: textStyles.length,
        components: Object.keys(components).length,
        tokens: tokenCount,
      },
    },
    meta: {
      url: location.href,
      title: doc.title,
      elementCount: doc.querySelectorAll('*').length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/** Build categorized color tokens (hex/rgb/hsl/cssVar/group/contrast/similar) from frequency data. */
function buildColorTokens(
  usage: { value: string; count: number }[],
  roles: Record<string, string>,
): ColorToken[] {
  const roleHexes = new Set(Object.values(roles).map((v) => v.toLowerCase()));
  let satIdx = 0;
  const groupIdx: Record<string, number> = {};

  const tokens: ColorToken[] = usage.map(({ value: hex, count }) => {
    const hsl = hslParts(hex);
    const roleHit = roleHexes.has(hex.toLowerCase());
    const saturated = !!hsl && hsl.s > 12 && !roleHit;
    const accentRank = saturated ? satIdx++ : 99;
    const cls = classifyColor(hex, { roles, accentRank });
    const n = (groupIdx[cls.group] = (groupIdx[cls.group] ?? 0) + 1);
    return {
      value: hex,
      hex,
      rgb: formatColor(hex, 'rgb'),
      hsl: formatColor(hex, 'hsl'),
      cssVar: `--color-${cls.group}-${n}`,
      group: cls.group,
      origin: cls.origin,
      confidence: cls.confidence,
      occurrences: count,
      onLight: round2(contrastRatio(hex, '#ffffff')),
      onDark: round2(contrastRatio(hex, '#111111')),
    };
  });

  // mark near-duplicates against an earlier (more frequent) token
  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < i; j++) {
      const d = colorDistance(tokens[i]!.hex, tokens[j]!.hex);
      if (d !== null && d < 10) {
        tokens[i]!.similarTo = tokens[j]!.hex;
        break;
      }
    }
  }
  return tokens;
}

function round2(n: number | null): number {
  return n === null ? 0 : Math.round(n * 100) / 100;
}

/** Map detected typography into semantic text styles (extracted where direct, else inferred). */
function buildTextStyles(
  headings: Record<string, TypeStyle>,
  body: TypeStyle | null,
  fontSizes: string[],
  components: Record<string, Record<string, string>>,
): TypeStyleToken[] {
  const out: TypeStyleToken[] = [];
  const nums = fontSizes.map((s) => parseFloat(s)).filter((n) => !Number.isNaN(n));
  const maxSize = nums.length ? Math.max(...nums) : null;

  const h1 = headings.h1;
  if (maxSize !== null) {
    const fromH1 = h1 && parseFloat(h1.size) === maxSize;
    out.push({
      name: 'Display',
      size: `${maxSize}px`,
      weight: h1?.weight ?? '700',
      lineHeight: h1?.lineHeight ?? '1.1',
      letterSpacing: h1?.letterSpacing,
      origin: fromH1 ? 'extracted' : 'inferred',
      source: fromH1 ? 'h1' : undefined,
    });
  }
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const s = headings[tag];
    if (s)
      out.push({
        name: tag.toUpperCase(),
        size: s.size,
        weight: s.weight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        origin: 'extracted',
        source: tag,
      });
  }
  if (body) {
    out.push({ ...styleOfBody(body, 'Body', 'body'), origin: 'extracted', source: 'body' });
    const b = parseFloat(body.size);
    if (!Number.isNaN(b)) {
      out.push({
        name: 'Body Small',
        size: `${Math.round(b * 0.875)}px`,
        weight: body.weight,
        lineHeight: body.lineHeight,
        origin: 'inferred',
      });
      out.push({
        name: 'Caption',
        size: `${Math.round(b * 0.75)}px`,
        weight: body.weight,
        lineHeight: '1.4',
        origin: 'inferred',
      });
    }
  }
  const btn = components.button;
  if (btn?.['font-size'])
    out.push({
      name: 'Button',
      size: btn['font-size'],
      weight: btn['font-weight'] ?? '600',
      lineHeight: '1',
      origin: 'extracted',
      source: 'button',
    });
  return out;
}

function styleOfBody(body: TypeStyle, name: string, source: string): TypeStyleToken {
  return {
    name,
    size: body.size,
    weight: body.weight,
    lineHeight: body.lineHeight,
    letterSpacing: body.letterSpacing,
    origin: 'extracted',
    source,
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
  const ls = cs.letterSpacing;
  return {
    size: cs.fontSize,
    weight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: ls && ls !== 'normal' ? ls : undefined,
  };
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
    let v = p === 'border' ? synthBorder(cs) : cs.getPropertyValue(p).trim();
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

function collectMotion(
  durationCss: string,
  timingCss: string,
  durations: Set<string>,
  easings: Set<string>,
): void {
  let hasDuration = false;
  for (const d of durationCss.split(',')) {
    const v = d.trim();
    if (v && v !== '0s') {
      durations.add(v);
      hasDuration = true;
    }
  }
  if (hasDuration) {
    for (const e of timingCss.split(',')) {
      const v = e.trim();
      if (v) easings.add(v);
    }
  }
}

/** Content container max-widths — prefer real containers, fall back to any bounded max-width. */
function detectContainers(doc: Document): string[] {
  const vals = new Map<string, number>();
  const add = (mw: string) => {
    const n = pxNum(mw);
    if (n !== null && n >= 320 && n <= 2000) vals.set(mw, (vals.get(mw) ?? 0) + 1);
  };
  doc
    .querySelectorAll(
      'main, article, [class*="container" i], [class*="wrapper" i], [class*="content" i]',
    )
    .forEach((el) => add(getComputedStyle(el).maxWidth));
  if (vals.size === 0) {
    Array.from(doc.querySelectorAll<HTMLElement>('body *'))
      .slice(0, 2000)
      .forEach((el) => add(getComputedStyle(el).maxWidth));
  }
  return [...vals.keys()].sort((a, b) => (pxNum(a) ?? 0) - (pxNum(b) ?? 0)).slice(0, 6);
}

/** @keyframes animation names from same-origin stylesheets. */
function extractKeyframes(doc: Document): string[] {
  const names = new Set<string>();
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSKeyframesRule) names.add(rule.name);
      else if (rule instanceof CSSMediaRule) walk(rule.cssRules);
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      continue; // cross-origin
    }
  }
  return [...names].slice(0, 12);
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

export function pxNum(v: string): number | null {
  const m = v.match(/^(-?\d+(?:\.\d+)?)px$/);
  return m && m[1] !== undefined ? parseFloat(m[1]) : null;
}

export function msOf(v: string): number {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return 0;
  return v.trim().endsWith('ms') ? n : n * 1000;
}
