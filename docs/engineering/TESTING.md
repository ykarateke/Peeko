# Testing — Peeko

Test only what's worth testing. Pure transforms get fast unit tests; DOM/overlay/simulator get manual smoke tests on real sites. There is no heavy E2E for v1.

## Philosophy

The valuable, breakable logic is **pure**: design-system exporters and color-format conversions (data in, string out). That is where bugs hide and where tests pay off. DOM-dependent code is hard to test meaningfully in a unit harness, so it is verified by smoke-testing on actual pages.

## What is tested, and how

| Area | Test type | What it asserts |
|------|-----------|-----------------|
| `core/design-system/export*` | Unit | token object → valid CSS/SCSS/JSON/Tailwind/Markdown (snapshot + real parse, not just string match) |
| `core/color/format` | Unit | HEX↔RGB↔HSL conversions are correct and round-trip |
| `core/messaging` | Compile-time | The `Msg` union type-checks across all contexts (no runtime test needed) |
| Inspector / overlay / simulator | Manual smoke | Works on a handful of real, varied sites |

### Exporter tests

- **Parse, don't just snapshot.** Feed the generated CSS/SCSS to a parser, the JSON to `JSON.parse`, the Tailwind output to its config loader where feasible — assert it's actually valid, per the acceptance metric in [`../product/ACCEPTANCE_CRITERIA.md`](../product/ACCEPTANCE_CRITERIA.md) (F4).
- Snapshots are a secondary guard against unintended formatting drift.

### Color-format tests

- Round-trip (`hex → rgb → hex`, etc.) and known-value checks. Cover edge cases: alpha, shorthand hex, out-of-gamut clamping.

## Manual smoke checklist (per milestone)

Run on both Chrome and Firefox, on a few real sites (a content-heavy site, an app with Shadow DOM, a page with many fonts/SVGs):

- [ ] Panel opens; inspect highlights and selects; grouped values copy in one click.
- [ ] Color pick works (EyeDropper and/or fallback); palette extracts.
- [ ] Assets list, preview, single + ZIP download land in `Peeko/` (`Peeko/fonts/` for fonts).
- [ ] Design-system generate → each export format previews and downloads.
- [ ] Simulator applies device/orientation/zoom; restores cleanly.
- [ ] Restricted page (`chrome://`) shows the polite `RestrictedTabError` message, no crash.
- [ ] **DevTools Network shows no extension-initiated requests** (global invariant G1).

## CI

Per [`TECHNICAL_DESIGN.md`](../architecture/TECHNICAL_DESIGN.md) §8, CI runs on every change:

```
pnpm lint
pnpm typecheck      # tsc --noEmit
pnpm test           # exporter + color-format unit tests
pnpm build          # wxt build (chrome)
pnpm build:firefox  # wxt build (firefox)
```

Both builds must be green before merge; see [`../product/ROADMAP.md`](../product/ROADMAP.md).
