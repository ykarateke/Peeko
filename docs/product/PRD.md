# Product Requirements — Peeko

> Open-source, backend-free, local-first design-inspection & asset-extraction browser extension (MV3, Chrome + Firefox).

## 1. Purpose & vision

A **free, privacy-friendly, open-source** browser extension that lets designers and developers inspect any website and instantly extract **CSS values, colors, fonts, assets, and design tokens**, and test responsive behavior with a device simulator.

Everything runs in the browser: no accounts, no login, no data sent to any server.

## 2. Goals & non-goals

### Goals
- A rich design-inspection and asset-extraction experience — entirely client-side.
- Operate without sending data to any external server (local-first, zero-backend).
- Support Chrome + Firefox (MV3) from a single codebase.
- Clean TypeScript source and a permissive open-source license (MIT).

### Non-goals (at least for v1)
- User accounts, login, cloud sync.
- Payment, subscription, usage quotas.
- Team sharing, cloud-hosted libraries.
- Live push to Figma (an export file is sufficient).

## 3. Personas

| Persona | Need |
|---------|------|
| **Frontend developer** | Quickly copy the exact CSS (color, spacing, font, shadow) from a site |
| **UI/UX designer** | Collect color palettes, typography, and assets for reference/inspiration |
| **Design-system owner** | Extract tokens from an existing product and export to CSS/Tailwind/JSON |
| **QA / responsive tester** | Preview a page at different device sizes |

## 4. Scope — feature requirements

Priority: **P0** = required for v1, **P1** = next, **P2** = optional.

### F1 — Element Inspector (P0)
- Hover/select elements via an overlay; read the selected element's `getComputedStyle` values.
- Groups: **Typography** (font-family/size/weight/line-height/letter-spacing), **Color** (color/background), **Layout** (display/flex/grid/width/height/padding/margin), **Border & Effects** (border/radius/box-shadow/opacity).
- **One-click copy** for every value.
- UI isolated from the page via Shadow DOM.
- Polite error message on restricted pages (`chrome://`, etc.).

### F2 — Color Picker & Palette (P0)
- Sample colors from the page (native `EyeDropper` API; fallback: overlay).
- Auto-extract the page's dominant palette.
- Switch between HEX/RGB/HSL, copy, and export the palette.

### F3 — Asset Extraction (P0)
- Types: **images, SVG, icons, videos, Lottie (JSON), fonts**.
- List + preview + individual or **bulk (ZIP)** download.
- Downloads go to the `Peeko/` folder (and `Peeko/fonts/`).

### F4 — Design System Generator (P0)
- Token extraction: colors, typography scale, spacing, border-radius, shadow, gradient, breakpoint.
- Export formats: **CSS variables, SCSS, JSON (design-tokens), Tailwind config/`@theme`, Markdown**.
- Preview + copy + download file.

### F5 — Device Simulator (P0)
- Preset device profiles (phone/tablet/desktop/watch) + custom size.
- DPR, orientation (portrait/landscape), zoom.
- UA spoofing where possible; otherwise viewport-only simulation.

### F6 — Measurement & Ruler (P1)
- Distance between elements, pixel measurement, alignment guides.

### F7 — Screenshot & Section Export (P1)
- Capture the visible area, a selected element, or a region; download as PNG.

### F8 — Settings (P1)
- Theme (light/dark), default color format, download folder name, export-format preferences.
- All preferences in `chrome.storage.local` (on-device only). See [`DATABASE.md`](../engineering/DATABASE.md).

## 5. Privacy & security requirements

- **Zero telemetry.** The extension initiates no network requests (except asset URLs the user downloads — already part of the page's source).
- All data stays on-device; `storage` is for user preferences only.
- The `<all_urls>` permission is explicitly justified in the README.
- Content scripts are Shadow-DOM-isolated; no global leakage into page JS.

See [`SECURITY.md`](../operations/SECURITY.md).

## 6. User flows (summary)

1. **Inspect:** extension icon → panel opens → "Inspect" → select an element → copy CSS values.
2. **Collect assets:** panel → "Assets" → choose type → preview → ZIP download.
3. **Extract tokens:** panel → "Design System" → "Generate" → choose format → copy/download.
4. **Responsive test:** panel → "Simulator" → choose device → set orientation/zoom.

## 7. Success metrics

Tracked as [`ACCEPTANCE_CRITERIA.md`](ACCEPTANCE_CRITERIA.md). Headline bar:
- F1–F5 fully functional and loadable in Chrome + Firefox for v1.
- No external network calls (verified via DevTools Network).
- From element selection to copying a value: < 3 clicks.
- Design-system export produces valid CSS/Tailwind/JSON (passes linting).

## 8. Risks & open questions

| Risk | Note |
|------|------|
| UA spoofing limited in MV3 | Limited solution via `declarativeNetRequest`; otherwise viewport-only simulation |
| Lottie/animation extraction is complex | First capture JSON / `<lottie-player>` sources; extraction from render is P2 |
| Cross-origin iframe inspection | `all_frames: true`, but CORS-restricted frames may be limited |
| Font (woff2) download CORS | `downloads` API fetches by URL; if raw data is needed, a one-time user-triggered fetch may be required |

Technical resolutions live in [`TECHNICAL_DESIGN.md`](../architecture/TECHNICAL_DESIGN.md) and [`DECISIONS.md`](../architecture/DECISIONS.md).
