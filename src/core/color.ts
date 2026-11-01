// Pure color-format conversions. DOM-free, unit-tested (see color.test.ts).

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/** Format a hex color ("#rrggbb" or "#rgb") as hex / rgb() / hsl(). Returns input unchanged if unparseable. */
export function formatColor(hex: string, fmt: ColorFormat): string {
  if (fmt === 'hex') return hex.toLowerCase();
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  return fmt === 'rgb' ? `rgb(${r}, ${g}, ${b})` : rgbToHsl(r, g, b);
}

export function parseHex(hex: string): [number, number, number] | null {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b].some((n) => Number.isNaN(n)) ? null : [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
