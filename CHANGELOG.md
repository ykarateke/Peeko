# Changelog

All notable changes to Peeko are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-01

First packaged release (F1–F8 complete). Store/AMO packages: `peeko-0.1.0-chrome.zip`,
`peeko-0.1.0-firefox.zip`, `peeko-0.1.0-sources.zip`.

### Added
- **Store icon** — Peeko mark (a lowercase "p" whose counter reads as a lens), hand-authored SVG, rasterized to `public/icon/{16,32,48,96,128,512}.png`; wired into the manifest `icons` + `action.default_icon`. Provenance: authored directly, no model/backend.
- Project documentation set (product, architecture, engineering, operations, planning).
- Product name finalized as **Peeko** (previously the working name "PageLens").
- **MIT** `LICENSE` (ADR-009).
- **M1 skeleton:** WXT + React + TypeScript project; side panel (Chrome `side_panel` / Firefox `sidebar_action`), background relay with inject-and-retry + `RestrictedTabError`, minimal content script. Both targets build green.
- **Styles panel UI** (first panel): toolbar, tabs (Styles/Assets/Inspect/Design), COLORS swatch grid, TYPOGRAPHY font cards with one-click CSS/TW copy and weight chips, footer.
- **Real page extraction** (`core/extract.ts`): the Styles panel reads the active page's dominant color palette, font families (with weights) and element count via the content → background relay, with a toolbar rescan and loading/restricted states.
- **Styles color tools:** Pick Color (native `EyeDropper`), Export Palette (CSS download), and a HEX/RGB/HSL format toggle that drives every copy and the export (`core/color.ts`).
- **Assets panel:** extracts images, SVG (inline + file), icons, video, Lottie and fonts from the page (`core/assets.ts`); type filter with real counts, preview grid, copy URL, and single download to `Peeko/` (fonts to `Peeko/fonts/`) via the `downloads` API. **Bulk ZIP download** (JSZip, lazy-loaded) packages the current filter, foldered by type, with progress and a skipped-count for blocked assets.
- **Inspect panel (F1):** click any element to read its `getComputedStyle` grouped into Typography / Color / Layout / Border & Effects (`core/inspect.ts`), with a Shadow-DOM hover/selection highlight (`core/highlight.ts`), one-click copy per value, color swatches, and Copy-all-as-CSS. Multi-select; ESC or toggle to exit; `Alt+Shift+I` keyboard shortcut.
- **Shared `useCopy` hook** — Styles and Assets refactored onto it.
- **Design System panel (F4):** extracts tokens from the page — colors + semantic roles, type scale, weights, line-heights, spacing, radii, shadows, gradients, breakpoints (`core/tokens.ts`) — and exports to **CSS, SCSS, JSON (W3C DTCG-style), Tailwind v4 `@theme`, Markdown**, plus an **AI Agent Brief** (LLM-ready Markdown analysis an agent can use to rebuild the design) (`core/exporters.ts`). Live preview, copy, per-format download. Shared `download.ts` helper.
- **Device Simulator (F5):** device profiles (phone/tablet/desktop/watch, `core/devices.ts`) opened in a device-sized popup window via `windows.create`, with portrait/landscape.
- **Measure / Ruler (F6):** drag-to-measure overlay with crosshair guides and px/Δx×Δy readout (`core/ruler.ts`, Shadow DOM); mutually exclusive with inspect.
- **Screenshot (F7):** capture visible area (`captureVisibleTab`) to PNG, plus selected-element crop from the Inspect panel (canvas, `rect×dpr`).
- **Settings + dark mode (F8):** `core/prefs.ts` (`storage.local`) — theme (system/light/**dark**), default color format, download folder, default export format — surfaced in a Settings view and wired into the panels; full dark theme via CSS variables.
- Toolbar now drives Simulator / Screenshot / Settings as views (the 4 tabs stay); collapse closes the panel.
- **Design output upgraded to a full design reference** (following the DESIGN.md convention): token extraction now also reads heading scale (h1–h6), body/link styles and component specs (button/link/input) + base spacing unit (`core/tokens.ts`); the **AI Agent Brief** is now a comprehensive report — overview, inferred design principles, color system with WCAG contrast, typography + headings table, spacing & breakpoints, component specs, and an explicit **Do/Don't rules for agents** section, plus the copy-pastable CSS block. Markdown export enriched to match; JSON carries the semantic data under DTCG `$extensions`.
- **Testing:** vitest; `core/color.ts`, `core/inspect.ts`, `core/exporters.ts`, `core/prefs.ts` and `toHex` covered (`pnpm test`, 27 tests).

### Planned
See [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md) for the milestone plan (M1–M6) toward v1.

<!--
Release template:

## [x.y.z] - YYYY-MM-DD
### Added
### Changed
### Fixed
### Removed
### Security
-->
