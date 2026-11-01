import { describe, it, expect } from 'vitest';
import { mergePrefs, DEFAULT_PREFS } from './prefs';

describe('mergePrefs', () => {
  it('returns defaults for undefined', () => {
    expect(mergePrefs(undefined)).toEqual(DEFAULT_PREFS);
  });

  it('overrides top-level fields', () => {
    expect(mergePrefs({ theme: 'dark', downloadFolder: 'Shots' })).toMatchObject({
      theme: 'dark',
      downloadFolder: 'Shots',
      defaultColorFormat: 'hex',
    });
  });

  it('deep-merges export without dropping defaults', () => {
    const m = mergePrefs({ export: { defaultFormat: 'css' } });
    expect(m.export.defaultFormat).toBe('css');
    expect(m.theme).toBe('system');
  });
});
