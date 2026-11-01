# Peeko

**Peeko** is a **local-first, zero-backend, open-source** browser extension (Manifest V3, Chrome + Firefox) that extracts **CSS values, colors, fonts, assets, and design tokens** from any web page, and previews responsive behavior with a built-in device simulator.

There are no accounts, no login, and no server. Every operation runs in the browser — the extension never sends your data anywhere.

## What it does

- **Inspect elements** — hover/select any element and read its `getComputedStyle` values (typography, color, layout, border & effects); copy any value with one click.
- **Pick colors & palettes** — sample colors from the page (native `EyeDropper`, overlay fallback), auto-extract the page's dominant palette, convert HEX/RGB/HSL.
- **Extract assets** — list, preview, and download (individually or as a ZIP) images, SVG, icons, videos, Lottie, and fonts.
- **Generate a design system** — extract tokens (color, typography, spacing, radius, shadow, gradient, breakpoint) and export to CSS variables, SCSS, JSON, Tailwind, or Markdown.
- **Simulate devices** — preview the page at phone/tablet/desktop/watch viewports with orientation, zoom, and DPR control.
- **Measure & capture** — ruler/measurement guides and PNG screenshots of the viewport, a selected element, or a region.

## Privacy, in one line

Local-first, zero telemetry. The extension makes no network requests of its own; the only outbound traffic is downloading assets **you** explicitly chose — and those URLs already belong to the page you are on.

## Documentation

| Area               | Document                                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent guidance** | [`AGENTS.md`](AGENTS.md)                                                                                                                                                                                                     |
| **Product**        | [`docs/product/PRD.md`](docs/product/PRD.md) · [`ROADMAP.md`](docs/product/ROADMAP.md) · [`ACCEPTANCE_CRITERIA.md`](docs/product/ACCEPTANCE_CRITERIA.md)                                                                     |
| **Architecture**   | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) · [`TECHNICAL_DESIGN.md`](docs/architecture/TECHNICAL_DESIGN.md) · [`DECISIONS.md`](docs/architecture/DECISIONS.md)                                 |
| **Engineering**    | [`docs/engineering/API_SPEC.md`](docs/engineering/API_SPEC.md) · [`DATABASE.md`](docs/engineering/DATABASE.md) · [`CODING_STANDARDS.md`](docs/engineering/CODING_STANDARDS.md) · [`TESTING.md`](docs/engineering/TESTING.md) |
| **Operations**     | [`docs/operations/DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md) · [`SECURITY.md`](docs/operations/SECURITY.md) · [`OBSERVABILITY.md`](docs/operations/OBSERVABILITY.md)                                                     |
| **Planning**       | [`docs/planning/TASKS.md`](docs/planning/TASKS.md)                                                                                                                                                                           |

> `API_SPEC.md` documents the **internal typed message protocol** between contexts (there is no HTTP API). `DATABASE.md` documents the **`chrome.storage.local` preference schema** (there is no database).

## Status

v0.1.0 — all features (F1–F8) implemented and packaged for Chrome + Firefox; store listing assets are the remaining pre-publish step. See [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md).

### Develop

```
pnpm install
pnpm dev            # Chrome (HMR)   ·   pnpm dev:firefox
pnpm check          # lint + typecheck + unit tests
pnpm build          # → .output/chrome-mv3   ·   pnpm build:firefox
```

## Tech stack

[WXT](https://wxt.dev) · React · TypeScript · Vite (via WXT) · JSZip · ESLint + Prettier · pnpm.

## License

[MIT](LICENSE).
