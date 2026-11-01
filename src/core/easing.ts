export type Bezier = [number, number, number, number];

const NAMED: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

/** Parse a CSS timing function to bezier control points; null if not a curve (e.g. steps()). */
export function parseEasing(value: string): Bezier | null {
  const key = value.trim().toLowerCase();
  if (key in NAMED) return NAMED[key]!;
  const m = key.match(/cubic-bezier\(([^)]+)\)/);
  if (!m || m[1] === undefined) return null;
  const n = m[1].split(',').map((x) => parseFloat(x.trim()));
  if (n.length !== 4 || n.some((x) => Number.isNaN(x))) return null;
  return [n[0]!, n[1]!, n[2]!, n[3]!];
}

/** SVG cubic path for a 0..1 easing curve in a size×size box (y inverted for screen space). */
export function easingPath(b: Bezier, size: number): string {
  const x = (t: number) => t * size;
  const y = (t: number) => size - t * size;
  return `M ${x(0)} ${y(0)} C ${x(b[0])} ${y(b[1])}, ${x(b[2])} ${y(b[3])}, ${x(1)} ${y(1)}`;
}
