# Tasks — Peeko

Working task breakdown, grouped by milestone (see [`../product/ROADMAP.md`](../product/ROADMAP.md)). Checkboxes track status. Features map to [`../product/PRD.md`](../product/PRD.md) (F1–F8).

## M1 — Skeleton

- [ ] Initialize WXT + React + TypeScript project (pnpm), ESLint + Prettier.
- [ ] Define `entrypoints/` (background, sidepanel, content, overlay.content, simulator.content) and `core/` layout.
- [ ] Manifest permissions: `downloads, activeTab, scripting, sidePanel, storage, tabs` + host `<all_urls>`.
- [ ] Cross-browser shim; Chrome `sidePanel` / Firefox `sidebarAction`.
- [ ] Side panel shell with empty tabs (Inspector, Assets, Design System, Simulator, Settings).
- [ ] `core/messaging.ts` `Msg` union (source of truth).
- [ ] Background relay with inject-and-retry + `RestrictedTabError`.
- [ ] CI: lint + typecheck + `wxt build` (both targets) green.

## M2 — Inspect + Color

- [ ] F1: overlay hover/selection layer (Shadow DOM isolated).
- [ ] F1: `getComputedStyle` reader → `ElementInfo` grouped (typography/color/layout/border-effects).
- [ ] F1: panel renders groups; one-click copy per value.
- [ ] F2: color sampling via `EyeDropper` + overlay fallback.
- [ ] F2: dominant-palette extraction.
- [ ] F2: HEX/RGB/HSL conversion (pure, unit-tested) + copy/export.

## M3 — Assets

- [ ] F3: extractors for images, SVG, icons, videos, Lottie (JSON), fonts.
- [ ] F3: list + preview UI.
- [ ] F3: single download → `Peeko/` (fonts → `Peeko/fonts/`).
- [ ] F3: bulk ZIP download (JSZip).

## M4 — Design System

- [ ] F4: `extractTokens(document)` (colors, typography, spacing, radii, shadows, gradients, breakpoints).
- [ ] F4: pure exporters — CSS, SCSS, JSON, Tailwind, Markdown.
- [ ] F4: exporter unit tests (parse/validate, not just snapshot).
- [ ] F4: preview + copy + download in panel.

## M5 — Simulator

- [ ] F5: `devices.ts` profiles (phone/tablet/desktop/watch) + custom size.
- [ ] F5: viewport application in fixed host div; DPR, orientation, zoom.
- [ ] F5: best-effort UA spoofing (`declarativeNetRequest`) or documented viewport-only fallback.
- [ ] F5: clean restore on deactivate.

## M6 — Measure / Capture + Settings + Release

- [ ] F6: ruler/measurement + alignment guides (`devicePixelRatio`-accurate).
- [ ] F7: screenshot — visible area (`captureVisibleTab`), element, region → PNG.
- [ ] F8: Settings UI + `chrome.storage.local` prefs (see [`../engineering/DATABASE.md`](../engineering/DATABASE.md)).
- [ ] Release: store assets, privacy forms (see [`../operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md)).
- [ ] Full manual smoke on Chrome + Firefox; Network zero-request verification.

## Cross-cutting (any time)

- [ ] Keep docs in sync with code (docs are authoritative).
- [ ] Maintain [`../../CHANGELOG.md`](../../CHANGELOG.md).
