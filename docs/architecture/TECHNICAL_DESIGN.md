# Technical Design — Peeko

> The architectural answer to the requirements in [`../product/PRD.md`](../product/PRD.md). Target: a backend-free, local-first MV3 extension.

## 1. Technology stack

| Layer               | Choice                            | Rationale                                                                                |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| Extension framework | **WXT** (`wxt.dev`)               | MV3 + Chrome/Firefox from one source, HMR, `createIsolatedElement` (Shadow DOM) built-in |
| UI                  | **React + TypeScript**            | Panel and overlay in React                                                               |
| Bundler             | **Vite** (inside WXT)             | Code-splitting (lazy-load panel components)                                              |
| Styling             | CSS Modules / Tailwind (optional) | Isolated CSS is mandatory for the overlay                                                |
| ZIP                 | **JSZip**                         | Bulk asset download                                                                      |
| Lint/format         | ESLint + Prettier                 | —                                                                                        |
| Package manager     | pnpm                              | —                                                                                        |

> No backend, auth, payment, or telemetry. The `identity` permission is not needed.

## 2. Project structure (source)

```
src/
├── entrypoints/
│   ├── background.ts          # Service worker: message relay + injection + downloads
│   ├── sidepanel/             # React panel app
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── panels/            # InspectorPanel, AssetsPanel, DesignSystemPanel,
│   │                          #   SimulatorPanel, SettingsPanel
│   ├── content.ts             # In-page inspection engine (each frame)
│   ├── overlay.content.ts     # Shadow DOM overlay UI (on demand)
│   └── simulator.content.ts   # Device simulator (on demand)
├── core/
│   ├── messaging.ts           # Typed message contract (single source)
│   ├── inspect/               # getComputedStyle reading, element selection
│   ├── color/                 # EyeDropper, palette extraction, format conversions
│   ├── assets/                # image/svg/icon/video/lottie/font extractors
│   ├── design-system/         # token extraction + exportToCSS/SCSS/JSON/Tailwind/Md
│   ├── simulator/             # device profiles + viewport application
│   └── download/              # downloads API + JSZip packaging
├── devices.ts                 # Device profiles
└── ui/                        # Shared React components
```

## 3. Message contract

A `type`-based, **typed** protocol. A single union in `src/core/messaging.ts`:

```ts
type Msg =
  | { type: 'TOGGLE_INSPECT' }
  | { type: 'STOP_INSPECT' }
  | { type: 'GET_INSPECT_STATUS' }
  | { type: 'ELEMENT_CLICKED'; data: ElementInfo }
  | { type: 'INSPECTOR_STOPPED' }
  | { type: 'OPEN_OVERLAY'; tabId?: number }
  | { type: 'START_COLOR_PICKER' }
  | { type: 'COLOR_PICKED'; color: string }
  | { type: 'TOGGLE_PAGE_RULER' }
  | { type: 'STOP_PAGE_RULER' }
  | { type: 'CAPTURE_SCREENSHOT' }
  | { type: 'CAPTURE_ELEMENT_SCREENSHOT' }
  | { type: 'EXPORT_SECTION' }
  | { type: 'DOWNLOAD_IMAGE'; url: string; filename: string }
  | { type: 'DOWNLOAD_FONT'; url: string; filename: string }
  | {
      type: `SIMULATOR_${'ACTIVATE' | 'DEACTIVATE' | 'STATUS' | 'CHANGE_DEVICE' | 'TOGGLE_ORIENTATION' | 'ZOOM'}`;
      payload?: unknown;
    };
```

The full per-message reference (direction, payload, response) is in [`../engineering/API_SPEC.md`](../engineering/API_SPEC.md).

## 4. Background service worker

- **Resilient relay:** if `tabs.sendMessage` returns _"receiving end does not exist"_, inject `content.ts` and retry; on restricted pages throw `RestrictedTabError` with a polite message (see [`ARCHITECTURE.md`](ARCHITECTURE.md) §5).
- **Script injection:** `OPEN_OVERLAY` → inject overlay + CSS; `SIMULATOR_*` → inject simulator (first probe with `SIMULATOR_STATUS`).
- **Downloads:** `DOWNLOAD_IMAGE`/`DOWNLOAD_FONT` → `downloads.download({ filename: "Peeko/..." })`.
- **Screenshots:** `CAPTURE_SCREENSHOT` → `tabs.captureVisibleTab`.
- **Panel lifecycle:** `onConnect("sidepanel-connection")` → on disconnect send `STOP_INSPECT` (short debounce to avoid false closes).
- **Chrome/Firefox:** `const api = globalThis.browser?.runtime?.id ? browser : chrome;` + Chrome `sidePanel` / Firefox `sidebarAction`.

## 5. Content scripts

### content.ts (each frame, automatic)

The inspection engine. Hover/selection, `getComputedStyle` reading, measurement, ruler, color-picker bridge. Uses `devicePixelRatio` for precise pixel measurement. Kept lightweight; heavy UI is moved to the overlay.

### overlay (injected on demand)

In-page React UI. **Shadow DOM isolation is mandatory** (WXT `createIsolatedElement` / `shadowDom: true`) — page styles must not break the UI. Very high `z-index`.

### simulator (on demand)

Reads a profile from `devices.ts`, applies the viewport inside a fixed host div, manages orientation/zoom/UA.

## 6. Design System Generator

A pure, testable module (`core/design-system/`):

```
extractTokens(document) -> { colors, typography, spacing, radii, shadows, gradients, breakpoints }
  → exportToCSS(tokens)      // :root { --color-*, --spacing-* }
  → exportToSCSS(tokens)
  → exportToJSON(tokens)     // design-tokens-like
  → exportToTailwind(tokens) // tailwind.config / @theme
  → exportToMarkdown(tokens) // readable document
```

DOM-independent (token object in, string out) → **easy unit tests**. The extraction step (DOM scanning) is kept separate.

## 7. Permissions (manifest)

```json
"permissions": ["downloads","activeTab","scripting","sidePanel","storage","tabs"],
"host_permissions": ["<all_urls>"]
```

`storage` is for local preferences only. With no account/auth, there is no `identity`. Full rationale: [`../operations/SECURITY.md`](../operations/SECURITY.md).

## 8. Build & distribution

- WXT dev: `pnpm dev` (Chrome), `pnpm dev:firefox`.
- Build: `pnpm build` → `.output/chrome-mv3`; `pnpm build:firefox` → `.output/firefox-mv3`.
- CI: lint + typecheck + design-system exporter tests + `wxt build` (both targets).
- License: MIT. The README justifies `<all_urls>` and download permissions.

See [`../operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md).

## 9. Test strategy

| Area                        | Test                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `design-system/export*`     | Unit test — token → valid CSS/SCSS/JSON/Tailwind (snapshot + parse) |
| `color/format`              | Unit test — HEX↔RGB↔HSL conversions                                 |
| `messaging`                 | Type-check (compile) is sufficient                                  |
| Inspector/overlay/simulator | Manual/E2E (smoke test on a few real sites)                         |

Pure transform logic (export, color format) is tested; DOM/overlay UI uses manual smoke tests instead of heavy E2E. See [`../engineering/TESTING.md`](../engineering/TESTING.md).

## 10. Incremental roadmap

See [`../product/ROADMAP.md`](../product/ROADMAP.md) (M1 skeleton → M6 release). Each milestone ends with a green build on both targets (`chrome`, `firefox`).
