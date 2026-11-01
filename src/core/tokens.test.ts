import { describe, it, expect } from 'vitest';
import { pxNum, msOf } from './tokens';

describe('pxNum', () => {
  it('parses px values', () => expect(pxNum('16px')).toBe(16));
  it('parses fractional', () => expect(pxNum('0.5px')).toBe(0.5));
  it('null for non-px', () => expect(pxNum('1rem')).toBeNull());
  it('null for keywords', () => expect(pxNum('auto')).toBeNull());
});

describe('msOf', () => {
  it('seconds to ms', () => expect(msOf('0.3s')).toBe(300));
  it('ms stays ms', () => expect(msOf('150ms')).toBe(150));
  it('0 for garbage', () => expect(msOf('ease')).toBe(0));
});
