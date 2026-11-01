# Tasks — Peeko

Working task breakdown, grouped by milestone (see [`../product/ROADMAP.md`](../product/ROADMAP.md)). Checkboxes track status. Features map to [`../product/PRD.md`](../product/PRD.md) (F1–F8).

## M1 — Skeleton

- [x] Initialize WXT + React + TypeScript project (pnpm). _(ESLint + Prettier: TODO)_
- [x] Define `entrypoints/` (background, sidepanel, content) and `core/` layout. _(overlay/simulator content scripts: M2/M5)_
- [x] Manifest permissions: `downloads, activeTab, scripting, sidePanel, storage, tabs` + host `<all_urls>`.
- [x] Cross-browser via WXT `browser`; Chrome `side_panel` / Firefox `sidebar_action`.
- [x] Side panel shell with tabs (Styles, Assets, Inspect, Design — no Pro/account per product rules).
- [x] `core/messaging.ts` `Msg` union (source of truth) + `RestrictedTabError`.
- [x] Background relay with inject-and-retry + `RestrictedTabError`.
- [x] `wxt build` green on both targets + `tsc --noEmit` clean. _(CI pipeline file: TODO)_

## M2 — Inspect + Color

- [x] Styles panel wired to **real page extraction** (`core/extract.ts`): palette + fonts + element count from the active tab, via content → background relay; toolbar rescan; loading/restricted states.
- [x] F2: dominant-palette extraction (by frequency).
- [x] F2: color sampling via `EyeDropper`. _(overlay fallback for unsupported browsers: later)_
- [x] F2: HEX/RGB/HSL conversion (`core/color.ts`, unit-tested) + copy + Export Palette (CSS).
- [x] Testing: vitest set up; `core/color.ts` + `core/inspect.ts` + `toHex` covered (`pnpm test`, 16 tests).
- [x] F1: hover/selection highlight (Shadow DOM isolated, `core/highlight.ts`); crosshair; ESC/toggle to exit; multi-select.
- [x] F1: `getComputedStyle` reader → `ElementInfo` grouped + selector/box (`core/inspect.ts`, `groupComputed` unit-tested).
- [x] F1: `InspectPanel` renders groups with one-click copy (+ color swatch, Copy-all-as-CSS); shared `useCopy` hook (Styles/Assets refactored onto it).
- [x] F1: keyboard shortcut `Alt+Shift+I` (manifest `commands` → background → relay).

## M3 — Assets

- [x] F3: extractors for images, SVG (inline + file), icons, video, Lottie, fonts (`core/assets.ts`).
- [x] F3: list + preview UI with type filter + real counts (`AssetsPanel`).
- [x] F3: single download → `Peeko/` (fonts → `Peeko/fonts/`) via background `downloads`; inline SVG via blob. + copy URL.
- [x] F3: bulk ZIP download (JSZip, lazy-loaded) — zips the current filter, foldered by type, cross-origin fetch via `<all_urls>`, skips blocked assets with a count.

## M4 — Design System

- [x] F4: `extractTokens(document)` — colors + semantic roles, type scale, weights, line-heights, spacing, radii, shadows, gradients, breakpoints (`core/tokens.ts`).
- [x] F4: pure exporters — CSS, SCSS, JSON (DTCG-style), Tailwind v4 `@theme`, Markdown + **AI Agent Brief** (`core/exporters.ts`).
- [x] F4: exporter unit tests (parse/validate — `exporters.test.ts`, 8 cases).
- [x] F4: `DesignPanel` — format selector, live preview, copy + download (per-format filename); shared `download.ts` helper (Styles/Assets refactored onto it).

## M5 — Simulator

- [x] F5: `devices.ts` profiles (phone/tablet/desktop/watch) + orientation swap.
- [x] F5: device-sized **popup window** via `windows.create` (reliable on every site). _(in-page viewport scaling not used — see ADR note)_
- [~] F5: UA spoofing not forced (documented limitation); DPR informational only.
- [x] F5: opens the current URL; restricted pages surface `RestrictedTabError`.

## M6 — Measure / Capture + Settings + Release

- [x] F6: drag-to-measure ruler + crosshair guides (Shadow-DOM overlay `core/ruler.ts`); ESC/toggle exit; mutually exclusive with inspect.
- [x] F7: screenshot — visible area (`captureVisibleTab`) + selected-element crop (canvas, `rect×dpr`). _(region drag: next)_
- [x] F8: Settings UI + `core/prefs.ts` (`storage.local`, see [`../engineering/DATABASE.md`](../engineering/DATABASE.md)) — theme (incl. **dark mode**), default color format, download folder, default export; wired into panels.
- [~] Release: **icons done** + zip packages (`pnpm zip`/`zip:firefox`, v0.1.0); store screenshots + descriptions + privacy forms still needed (see [`../operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md)).
- [ ] Full manual smoke on Chrome + Firefox; Network zero-request verification.

## Cross-cutting (any time)

- [ ] Keep docs in sync with code (docs are authoritative).
- [ ] Maintain [`../../CHANGELOG.md`](../../CHANGELOG.md).
