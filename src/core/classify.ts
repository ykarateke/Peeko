import { hslParts } from './color';
import type { ColorGroup, Token, TokenOrigin } from './messaging';

export interface ClassifyCtx {
  roles: Record<string, string>; // role -> hex
  accentRank: number; // index among saturated, non-semantic colors (0 = most frequent)
}

/** Classify a hex into a semantic color group with an origin + confidence. */
export function classifyColor(
  hex: string,
  ctx: ClassifyCtx,
): { group: ColorGroup; origin: TokenOrigin; confidence: number } {
  const role = Object.entries(ctx.roles).find(
    ([, v]) => v.toLowerCase() === hex.toLowerCase(),
  )?.[0];
  if (role === 'background') return { group: 'background', origin: 'extracted', confidence: 0.9 };
  if (role === 'text' || role === 'heading')
    return { group: 'text', origin: 'extracted', confidence: 0.9 };
  if (role === 'border') return { group: 'border', origin: 'extracted', confidence: 0.8 };
  if (role === 'accent') return { group: 'primary', origin: 'inferred', confidence: 0.7 };
  if (role === 'link') return { group: 'accent', origin: 'inferred', confidence: 0.6 };

  const hsl = hslParts(hex);
  if (!hsl) return { group: 'other', origin: 'extracted', confidence: 0.3 };
  const { h, s, l } = hsl;

  if (s <= 12) {
    if (l >= 92) return { group: 'background', origin: 'inferred', confidence: 0.5 };
    if (l >= 80) return { group: 'surface', origin: 'inferred', confidence: 0.5 };
    if (l <= 30) return { group: 'text', origin: 'inferred', confidence: 0.5 };
    return { group: 'border', origin: 'inferred', confidence: 0.4 };
  }

  const sem = semanticByHue(h);
  if (sem) return { group: sem, origin: 'inferred', confidence: 0.45 };

  if (ctx.accentRank === 0) return { group: 'primary', origin: 'inferred', confidence: 0.6 };
  if (ctx.accentRank === 1) return { group: 'secondary', origin: 'inferred', confidence: 0.5 };
  return { group: 'accent', origin: 'inferred', confidence: 0.4 };
}

function semanticByHue(h: number): ColorGroup | null {
  if (h >= 350 || h < 12) return 'error'; // red
  if (h >= 35 && h < 60) return 'warning'; // amber/yellow
  if (h >= 95 && h < 160) return 'success'; // green
  if (h >= 190 && h < 215) return 'info'; // cyan/azure
  return null;
}

const SCALE = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
const NAMES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];

export function scaleName(i: number): string {
  return NAMES[i] ?? `s${i + 1}`;
}

/** Snap extracted spacing px values to a standard scale → normalized tokens. */
export function normalizeSpacing(values: string[]): Token[] {
  const snapped = new Map<number, number>();
  for (const v of values) {
    const n = parseFloat(v);
    if (Number.isNaN(n)) continue;
    const near = SCALE.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), SCALE[0]!);
    snapped.set(near, (snapped.get(near) ?? 0) + 1);
  }
  return [...snapped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([px, count]) => ({
      value: `${px}px`,
      origin: 'normalized' as const,
      occurrences: count,
    }));
}

export interface StyleInput {
  radii: string[];
  shadows: string[];
  colors: string[];
  fontFamilies: string[];
}

/** Infer a coarse design-style label + characteristics (clearly an inference). */
export function designStyle(t: StyleInput): {
  label: string;
  confidence: number;
  characteristics: string[];
} {
  const maxRadius = Math.max(0, ...t.radii.map((r) => parseFloat(r) || 0));
  const rounded = maxRadius >= 12;
  const sharp = maxRadius <= 2;
  const hasShadow = t.shadows.length > 0;
  const serif = t.fontFamilies.some((f) => /serif/i.test(f) && !/sans/i.test(f));
  const mono = t.fontFamilies.some((f) => /mono/i.test(f));

  const characteristics: string[] = [];
  characteristics.push(rounded ? 'Rounded corners' : sharp ? 'Sharp corners' : 'Subtle rounding');
  characteristics.push(hasShadow ? `${t.shadows.length} elevation level(s)` : 'Flat — no shadows');
  characteristics.push(`${t.colors.length}-color palette`);
  if (serif) characteristics.push('Serif typography');
  if (mono) characteristics.push('Monospace accents');

  let label = 'Clean';
  if (rounded && hasShadow) label = 'Modern';
  else if (sharp && !hasShadow) label = t.colors.length <= 6 ? 'Minimal' : 'Brutalist';
  else if (serif) label = 'Editorial';
  else if (!hasShadow) label = 'Minimal';

  return { label, confidence: 0.5, characteristics };
}

export interface ConsistencyInput {
  colors: number;
  fontSizes: number;
  spacing: number;
  radii: number;
}

/** 0-100: tighter scales (fewer distinct values) score higher. */
export function consistencyScore(t: ConsistencyInput): number {
  const pen = (n: number, good: number, bad: number) =>
    Math.max(0, Math.min(1, (n - good) / (bad - good)));
  const raw =
    0.3 * pen(t.colors, 8, 40) +
    0.3 * pen(t.fontSizes, 5, 16) +
    0.25 * pen(t.spacing, 6, 14) +
    0.15 * pen(t.radii, 2, 8);
  return Math.round(100 - raw * 100);
}
