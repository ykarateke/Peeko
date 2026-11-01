import { describe, it, expect } from 'vitest';
import {
  classifyColor,
  normalizeSpacing,
  scaleName,
  designStyle,
  consistencyScore,
} from './classify';

describe('classifyColor', () => {
  const ctx = { roles: { background: '#ffffff', text: '#111111' }, accentRank: 0 };
  it('matches role → background (extracted)', () =>
    expect(classifyColor('#ffffff', ctx)).toMatchObject({
      group: 'background',
      origin: 'extracted',
    }));
  it('role text (extracted)', () =>
    expect(classifyColor('#111111', ctx)).toMatchObject({ group: 'text', origin: 'extracted' }));
  it('saturated red → error (inferred)', () =>
    expect(classifyColor('#e5484d', { roles: {}, accentRank: 5 })).toMatchObject({
      group: 'error',
      origin: 'inferred',
    }));
  it('saturated green → success', () =>
    expect(classifyColor('#2fa84f', { roles: {}, accentRank: 5 }).group).toBe('success'));
  it('top saturated non-semantic → primary', () =>
    expect(classifyColor('#4b74ff', { roles: {}, accentRank: 0 }).group).toBe('primary'));
  it('light neutral → background', () =>
    expect(classifyColor('#f5f5f4', { roles: {}, accentRank: 9 }).group).toBe('background'));
});

describe('normalizeSpacing', () => {
  it('snaps to the standard scale', () => {
    const out = normalizeSpacing(['7px', '15px', '33px']);
    expect(out.map((t) => t.value)).toEqual(['8px', '16px', '32px']);
    expect(out.every((t) => t.origin === 'normalized')).toBe(true);
  });
});

describe('scaleName', () => {
  it('ramps xs→…', () => expect([scaleName(0), scaleName(2)]).toEqual(['xs', 'md']));
});

describe('designStyle', () => {
  it('rounded + shadow → Modern', () => {
    const s = designStyle({
      radii: ['16px'],
      shadows: ['0 1px 2px #0001'],
      colors: ['#000'],
      fontFamilies: ['Inter'],
    });
    expect(s.label).toBe('Modern');
    expect(s.characteristics.length).toBeGreaterThan(0);
  });
  it('sharp + flat + few colors → Minimal', () =>
    expect(
      designStyle({ radii: [], shadows: [], colors: ['#000', '#fff'], fontFamilies: ['Arial'] })
        .label,
    ).toBe('Minimal'));
});

describe('consistencyScore', () => {
  it('tight scales score high', () =>
    expect(consistencyScore({ colors: 6, fontSizes: 4, spacing: 5, radii: 2 })).toBeGreaterThan(
      90,
    ));
  it('sprawling scales score lower', () =>
    expect(consistencyScore({ colors: 40, fontSizes: 16, spacing: 14, radii: 8 })).toBeLessThan(
      10,
    ));
});
