/** Scroll offsets to tile a page of `total` height with a `viewport`-tall window.
 *  The final offset is clamped so the last tile ends exactly at the bottom. */
export function tileOffsets(total: number, viewport: number): number[] {
  if (viewport <= 0 || total <= viewport) return [0];
  const out: number[] = [];
  for (let y = 0; y < total - viewport; y += viewport) out.push(y);
  out.push(total - viewport);
  return out;
}
