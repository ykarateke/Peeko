import { describe, it, expect } from 'vitest';
import { tileOffsets } from './capture-math';

describe('tileOffsets', () => {
  it('single tile when page fits the viewport', () => {
    expect(tileOffsets(800, 800)).toEqual([0]);
    expect(tileOffsets(500, 800)).toEqual([0]);
  });
  it('exact multiples', () => expect(tileOffsets(2000, 1000)).toEqual([0, 1000]));
  it('clamps the final tile to the bottom', () =>
    expect(tileOffsets(1500, 1000)).toEqual([0, 500]));
  it('three tiles', () => expect(tileOffsets(2500, 1000)).toEqual([0, 1000, 1500]));
  it('guards zero viewport', () => expect(tileOffsets(2000, 0)).toEqual([0]));
});
