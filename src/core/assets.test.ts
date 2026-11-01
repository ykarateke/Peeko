import { describe, it, expect } from 'vitest';
import { nameFromUrl, fontFormat } from './assets';

describe('nameFromUrl', () => {
  it('takes the last path segment', () =>
    expect(nameFromUrl('https://x.test/img/logo.png?v=2')).toBe('logo.png'));
  it('decodes percent-encoding', () =>
    expect(nameFromUrl('https://x.test/a/My%20Font.woff2')).toBe('My Font.woff2'));
  it('labels data URLs as inline', () =>
    expect(nameFromUrl('data:image/svg+xml,...')).toBe('inline'));
});

describe('fontFormat', () => {
  it('detects woff2', () => expect(fontFormat('https://x.test/f.woff2')).toBe('WOFF2'));
  it('detects ttf with query', () => expect(fontFormat('/f.ttf?x=1')).toBe('TTF'));
  it('undefined for non-font', () => expect(fontFormat('/f.png')).toBeUndefined());
});
