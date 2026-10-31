# Roadmap — Peeko

Incremental milestones toward v1. Each milestone must end with a **green build on both targets** (`chrome`, `firefox`) and the relevant acceptance criteria met ([`ACCEPTANCE_CRITERIA.md`](ACCEPTANCE_CRITERIA.md)).

| Milestone | Scope | Delivers |
|-----------|-------|----------|
| **M1 — Skeleton** | WXT setup, side panel + background relay + content injection (empty UI) | Loadable extension; panel ↔ page messaging works; resilient-messaging + `RestrictedTabError` in place |
| **M2 — Inspect + Color** | F1 Element Inspector, F2 Color Picker & Palette | Hover/select, grouped `getComputedStyle`, one-click copy; EyeDropper + palette extraction + HEX/RGB/HSL |
| **M3 — Assets** | F3 Asset Extraction + ZIP download | List/preview/download images, SVG, icons, videos, Lottie, fonts; bulk ZIP via JSZip |
| **M4 — Design System** | F4 Design System Generator | Token extraction + export to CSS/SCSS/JSON/Tailwind/Markdown (unit-tested exporters) |
| **M5 — Simulator** | F5 Device Simulator | Device profiles, orientation, zoom, DPR; UA spoofing where feasible |
| **M6 — Measure/Capture + Settings + Release** | F6 Measurement, F7 Screenshot, F8 Settings, release packaging | Ruler, PNG capture, preferences in `storage.local`; store/AMO submission package |

## v1 definition of done

- F1–F5 fully functional on Chrome + Firefox.
- F6–F8 present (P1) and stable.
- Zero external network calls (verified).
- CI green: lint + typecheck + exporter tests + `wxt build` on both targets.
- Release package prepared per [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md).

## Post-v1 candidates (P2)

- Lottie extraction from rendered animations.
- Richer UA spoofing via `declarativeNetRequest`.
- Additional export formats / design-token spec coverage.

Detailed task breakdown: [`../planning/TASKS.md`](../planning/TASKS.md).
