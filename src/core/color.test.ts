import { describe, it, expect } from 'vitest';
import { formatColor, parseHex, contrastRatio, wcagLevel } from './color';
import { toHex } from './extract';

describe('parseHex', () => {
  it('parses 6-digit hex', () => expect(parseHex('#4b74ff')).toEqual([75, 116, 255]));
  it('expands 3-digit hex', () => expect(parseHex('#fff')).toEqual([255, 255, 255]));
  it('rejects garbage', () => expect(parseHex('nope')).toBeNull());
});

describe('formatColor', () => {
  it('hex passes through lowercased', () => expect(formatColor('#FFFFFF', 'hex')).toBe('#ffffff'));
  it('rgb', () => expect(formatColor('#4b74ff', 'rgb')).toBe('rgb(75, 116, 255)'));
  it('hsl white', () => expect(formatColor('#ffffff', 'hsl')).toBe('hsl(0, 0%, 100%)'));
  it('hsl red', () => expect(formatColor('#ff0000', 'hsl')).toBe('hsl(0, 100%, 50%)'));
  it('returns input unchanged when unparseable', () =>
    expect(formatColor('xyz', 'rgb')).toBe('xyz'));
});

describe('contrastRatio / wcagLevel', () => {
  it('black on white is 21:1 (AAA)', () => {
    const r = contrastRatio('#000000', '#ffffff');
    expect(r).toBeCloseTo(21, 0);
    expect(wcagLevel(r!)).toBe('AAA');
  });
  it('same color is 1:1 (Fail)', () => {
    const r = contrastRatio('#777777', '#777777');
    expect(r).toBeCloseTo(1, 1);
    expect(wcagLevel(r!)).toBe('Fail');
  });
  it('null for unparseable', () => expect(contrastRatio('x', '#fff')).toBeNull());
});

describe('toHex (from computed rgb strings)', () => {
  it('rgb', () => expect(toHex('rgb(75, 116, 255)')).toBe('#4b74ff'));
  it('rgba with alpha', () => expect(toHex('rgba(255, 0, 0, 0.5)')).toBe('#ff0000'));
  it('fully transparent -> null', () => expect(toHex('rgba(0, 0, 0, 0)')).toBeNull());
  it('non-color -> null', () => expect(toHex('none')).toBeNull());
});
