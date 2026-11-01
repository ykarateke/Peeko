# Data Storage — `chrome.storage.local` Schema

> Peeko has **no database** (zero-backend, local-first — see [`DECISIONS.md`](../architecture/DECISIONS.md) ADR-001). The only persisted state is **user preferences** in `chrome.storage.local`, on-device only. This document is that schema.

## Scope

- **What is stored:** user preferences (Settings / F8).
- **What is NOT stored:** inspected page data, extracted tokens, assets, colors, screenshots. These are produced on demand and handed to the user (clipboard/download); they are never persisted or sent anywhere.
- **Where:** `chrome.storage.local` (local to the browser profile; not synced). No `storage.sync`, so preferences do not leave the device.

## Keys

| Key             | Type          | Default   | Notes                                   |
| --------------- | ------------- | --------- | --------------------------------------- |
| `prefs`         | `Preferences` | see below | Single object holding all user settings |
| `schemaVersion` | `number`      | `1`       | For future migrations                   |

Storing everything under one `prefs` object keeps reads/writes atomic and migrations simple.

## `Preferences` shape

```ts
interface Preferences {
  theme: 'system' | 'light' | 'dark'; // default: "system"
  defaultColorFormat: 'hex' | 'rgb' | 'hsl'; // default: "hex"
  downloadFolder: string; // default: "Peeko"
  export: {
    defaultFormat: 'css' | 'scss' | 'json' | 'tailwind' | 'markdown'; // default: "css"
  };
}

const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  defaultColorFormat: 'hex',
  downloadFolder: 'Peeko',
  export: { defaultFormat: 'css' },
};
```

## Access pattern

- A thin accessor (e.g. `core/download/` or a small `core/prefs.ts`) wraps `storage.local.get/set`, merges with `DEFAULT_PREFS`, and returns a fully-populated object so callers never deal with `undefined`.
- Writes are shallow-merged into `prefs`; the whole object is re-saved.
- UI subscribes via `storage.onChanged` so the panel updates when preferences change.

## Migrations

- On startup, read `schemaVersion`. If it is below the current version, apply ordered migration steps, then bump it.
- Because preferences are small and non-critical, an unreadable/invalid value falls back to `DEFAULT_PREFS` rather than failing.

## Privacy guarantee

Nothing here syncs or leaves the device. `downloadFolder` only names a local subfolder for the `downloads` API; it is not a path the extension reads from. See [`../operations/SECURITY.md`](../operations/SECURITY.md).
