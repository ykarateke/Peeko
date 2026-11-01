import { browser } from 'wxt/browser';
import type { ColorFormat } from './color';

// User preferences (on-device only, storage.local). Schema: docs/engineering/DATABASE.md.

export type Theme = 'system' | 'light' | 'dark';
export type ExportFormat = 'agent' | 'css' | 'scss' | 'json' | 'tailwind' | 'markdown';

export interface Preferences {
  theme: Theme;
  defaultColorFormat: ColorFormat;
  downloadFolder: string;
  export: { defaultFormat: ExportFormat };
}

export const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  defaultColorFormat: 'hex',
  downloadFolder: 'Peeko',
  export: { defaultFormat: 'agent' },
};

/** Pure: shallow-merge a partial over defaults (one level deep for `export`). */
export function mergePrefs(saved: Partial<Preferences> | undefined): Preferences {
  return {
    ...DEFAULT_PREFS,
    ...saved,
    export: { ...DEFAULT_PREFS.export, ...saved?.export },
  };
}

export async function getPrefs(): Promise<Preferences> {
  try {
    const { prefs } = await browser.storage.local.get('prefs');
    return mergePrefs(prefs as Partial<Preferences> | undefined);
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setPrefs(patch: Partial<Preferences>): Promise<Preferences> {
  const next = mergePrefs({ ...(await getPrefs()), ...patch });
  try {
    await browser.storage.local.set({ prefs: next });
  } catch {
    /* ignore (private mode / blocked storage) */
  }
  return next;
}

export function onPrefsChanged(cb: (prefs: Preferences) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'local' && changes.prefs) cb(mergePrefs(changes.prefs.newValue as Partial<Preferences>));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
