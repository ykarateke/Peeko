import { describe, it, expect } from 'vitest';
import { groupComputed } from './inspect';

const values: Record<string, string> = {
  'font-family': 'Inter, sans-serif',
  'font-size': '16px',
  'line-height': 'normal', // noise
  color: 'rgb(20, 20, 20)',
  'background-color': 'rgba(0, 0, 0, 0)', // noise
  display: 'flex',
  gap: '0px', // noise
  'align-items': 'center',
  'border-radius': '8px',
  'box-shadow': 'none', // noise
  opacity: '1',
};

const get = (p: string) => values[p] ?? '';

describe('groupComputed', () => {
  const g = groupComputed(get);

  it('groups typography and drops noise', () => {
    expect(g.typography['font-size']).toBe('16px');
    expect(g.typography['font-family']).toContain('Inter');
    expect(g.typography['line-height']).toBeUndefined();
  });

  it('keeps real color, drops transparent background', () => {
    expect(g.color['color']).toBe('rgb(20, 20, 20)');
    expect(g.color['background-color']).toBeUndefined();
  });

  it('keeps layout, drops gap:0px', () => {
    expect(g.layout['display']).toBe('flex');
    expect(g.layout['align-items']).toBe('center');
    expect(g.layout['gap']).toBeUndefined();
  });

  it('keeps effects, drops box-shadow:none', () => {
    expect(g.borderEffects['border-radius']).toBe('8px');
    expect(g.borderEffects['opacity']).toBe('1');
    expect(g.borderEffects['box-shadow']).toBeUndefined();
  });
});
