import { describe, it, expect } from 'vitest';
import { parseEasing, easingPath } from './easing';

describe('parseEasing', () => {
  it('resolves named easings', () =>
    expect(parseEasing('ease-in-out')).toEqual([0.42, 0, 0.58, 1]));
  it('parses cubic-bezier', () =>
    expect(parseEasing('cubic-bezier(0.4, 0, 0.2, 1)')).toEqual([0.4, 0, 0.2, 1]));
  it('null for steps()', () => expect(parseEasing('steps(4, end)')).toBeNull());
  it('null for malformed', () => expect(parseEasing('cubic-bezier(0.4, 0)')).toBeNull());
});

describe('easingPath', () => {
  it('builds a cubic path in the box with inverted y', () =>
    expect(easingPath([0, 0, 1, 1], 100)).toBe('M 0 100 C 0 100, 100 0, 100 0'));
});
