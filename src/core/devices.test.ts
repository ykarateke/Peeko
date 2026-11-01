import { describe, it, expect } from 'vitest';
import { DEVICES, orient } from './devices';

describe('devices', () => {
  it('has unique ids', () => {
    expect(new Set(DEVICES.map((d) => d.id)).size).toBe(DEVICES.length);
  });

  it('orient keeps portrait as-is', () => {
    const p = DEVICES[0]!;
    expect(orient(p, false)).toEqual({ width: p.width, height: p.height });
  });

  it('orient swaps for landscape', () => {
    const p = DEVICES[0]!;
    expect(orient(p, true)).toEqual({ width: p.height, height: p.width });
  });
});
