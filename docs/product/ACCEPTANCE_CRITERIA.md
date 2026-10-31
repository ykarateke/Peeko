# Acceptance Criteria — Peeko

Feature-level acceptance criteria, in Given/When/Then form. A feature is "done" when all its criteria pass on **both** Chrome and Firefox.

## Global (applies to every feature)

- **G1** Given any feature runs, When DevTools Network is observed, Then the extension initiates **no** network request of its own (asset downloads the user triggers are expected and allowed).
- **G2** Given a restricted page (`chrome://`, extension page, error page), When the user invokes any inspection feature, Then a polite message is shown (`RestrictedTabError`) and nothing crashes.
- **G3** Given in-page UI is shown, When the host page has aggressive CSS, Then the overlay renders correctly (Shadow DOM isolation) and no styles leak either way.
- **G4** Given the extension is loaded, When tested on Chrome and on Firefox, Then behavior is equivalent (panel on `sidePanel` / `sidebarAction` respectively).

## F1 — Element Inspector (P0)

- Given Inspect is active, When the user hovers elements, Then a highlight tracks the hovered element.
- Given an element is selected, When the panel renders, Then values are grouped into Typography, Color, Layout, Border & Effects.
- Given any value is shown, When the user clicks it, Then it is copied to the clipboard (one click).
- **Metric:** from element selection to a copied value ≤ 3 clicks total.

## F2 — Color Picker & Palette (P0)

- Given the browser supports `EyeDropper`, When the user picks, Then the sampled color appears; else the overlay fallback is used.
- Given a page is loaded, When the user requests a palette, Then the dominant colors are extracted and listed.
- Given a color is shown, When the user toggles format, Then it switches between HEX/RGB/HSL and can be copied/exported.

## F3 — Asset Extraction (P0)

- Given a page with assets, When the user opens Assets, Then images, SVG, icons, videos, Lottie, and fonts are listed with previews.
- Given listed assets, When the user downloads one, Then it is saved under `Peeko/` (fonts under `Peeko/fonts/`).
- Given multiple selected assets, When the user requests bulk download, Then a single ZIP is produced (JSZip).

## F4 — Design System Generator (P0)

- Given a page, When the user clicks Generate, Then tokens are extracted: colors, typography scale, spacing, radius, shadow, gradient, breakpoint.
- Given tokens, When the user selects a format, Then valid CSS variables / SCSS / JSON / Tailwind / Markdown is produced, previewable, copyable, and downloadable.
- **Metric:** exported CSS/Tailwind/JSON passes linting/parsing (covered by exporter unit tests, see [`TESTING.md`](../engineering/TESTING.md)).

## F5 — Device Simulator (P0)

- Given a device profile, When selected, Then the viewport resizes to that profile (with DPR applied).
- Given a simulated viewport, When the user toggles orientation/zoom, Then the preview updates accordingly.
- Given UA spoofing is unavailable, When simulating, Then viewport-only simulation is used (documented limitation).

## F6 — Measurement & Ruler (P1)

- Given two elements, When measuring, Then the pixel distance and alignment guides are shown.

## F7 — Screenshot & Section Export (P1)

- Given the viewport or a selected element/region, When the user captures, Then a PNG is produced and downloadable.

## F8 — Settings (P1)

- Given the Settings tab, When the user changes theme / default color format / download folder / export preferences, Then the choice persists in `chrome.storage.local` and survives a browser restart.
- Given no cloud sync exists, When settings change, Then nothing is sent off-device.
