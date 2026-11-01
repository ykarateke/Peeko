import { describe, it, expect } from 'vitest';
import { isSafeUrl, sanitizeName, rewriteCssUrls, cssUrlRefs, pickSrcset } from './source-export';

describe('isSafeUrl', () => {
  it('allows public http/https', () => {
    expect(isSafeUrl('https://example.com/a.css')).toBe(true);
    expect(isSafeUrl('http://cdn.example.org/x.js')).toBe(true);
  });
  it('blocks loopback, private, metadata, non-http', () => {
    expect(isSafeUrl('http://localhost/x')).toBe(false);
    expect(isSafeUrl('http://127.0.0.1/x')).toBe(false);
    expect(isSafeUrl('http://10.0.0.5/x')).toBe(false);
    expect(isSafeUrl('http://192.168.1.1/x')).toBe(false);
    expect(isSafeUrl('http://172.16.0.1/x')).toBe(false);
    expect(isSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('ftp://example.com/x')).toBe(false);
  });
});

describe('sanitizeName', () => {
  it('takes last segment, strips query', () =>
    expect(sanitizeName('https://x.test/a/b/style.css?v=2', 'f')).toBe('style.css'));
  it('sanitizes unsafe chars', () =>
    expect(sanitizeName('https://x.test/a/My File!.png', 'f')).toBe('My_File_.png'));
  it('falls back when empty', () =>
    expect(sanitizeName('https://x.test/', 'index.html')).toBe('index.html'));
});

describe('rewriteCssUrls', () => {
  it('rewrites mapped urls and keeps unmapped', () => {
    const css = "a{background:url('img/x.png')}b{background:url(/y.png)}";
    const out = rewriteCssUrls(css, (u) => (u.includes('x.png') ? '../assets/x.png' : null));
    expect(out).toContain("url('../assets/x.png')");
    expect(out).toContain('url(/y.png)');
  });
});

describe('pickSrcset', () => {
  it('falls back without srcset', () => expect(pickSrcset(null, '/a.png')).toBe('/a.png'));
  it('picks largest width', () =>
    expect(pickSrcset('/s.png 480w, /m.png 800w, /l.png 1200w', null)).toBe('/l.png'));
  it('picks highest density', () =>
    expect(pickSrcset('/a.png 1x, /b.png 2x', null)).toBe('/b.png'));
});

describe('cssUrlRefs', () => {
  it('resolves absolute, skips data URIs', () => {
    const refs = cssUrlRefs(
      '@font-face{src:url(../f/a.woff2)}i{background:url(data:xxx)}',
      'https://x.test/css/s.css',
    );
    expect(refs).toEqual(['https://x.test/f/a.woff2']);
  });
});
