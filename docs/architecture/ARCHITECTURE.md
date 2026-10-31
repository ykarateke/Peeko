# Architecture & Runtime — Peeko

> How Peeko is structured and how it behaves at runtime. For product requirements see [`../product/PRD.md`](../product/PRD.md); for code-level design see [`TECHNICAL_DESIGN.md`](TECHNICAL_DESIGN.md).

## 1. Core idea

The user opens Peeko on any site; a **side panel** plus an injected in-page **overlay** let them:

- Select an element, read its CSS, and copy values.
- Pick colors and extract the page's palette.
- Download images, SVG, icons, fonts, videos, and Lottie animations.
- Generate a **design system** (token set) and export it as CSS/SCSS/JSON/Tailwind/Markdown.
- Preview different screen sizes with the device simulator.
- Capture screenshots/regions and measure with a ruler.

**Local-first:** no account, login, or server. Everything happens in the browser; the extension sends no data out.

## 2. Three execution contexts

The extension runs across three separate JavaScript worlds. The panel and the page cannot talk directly, so the **background service worker is the central relay** (the MV3 model).

```
┌───────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  ┌───────────────┐    message   ┌──────────────────┐           │
│  │  Side Panel    │◄───────────►│  Background       │           │
│  │  (React UI)    │  runtime     │  Service Worker  │           │
│  └───────┬───────┘  messaging   └────────┬─────────┘           │
│          │                               │                     │
│          │        relay (background)     │ scripting.execute   │
│          └───────────────┬───────────────┘                     │
│                          ▼                                      │
│  ┌───────────────────────────────────────────┐                │
│  │  PAGE (each frame)                          │                │
│  │  content   — inspection engine (automatic)  │                │
│  │  overlay   — in-page UI (on demand)         │                │
│  │  simulator — device simulator (on demand)   │                │
│  └───────────────────────────────────────────┘                │
└───────────────────────────────────────────────────────────────┘
```

| Context | Responsibility |
|---------|----------------|
| **Side panel (UI)** | React interface; tabs: Inspector, Assets, Design System, Simulator, Settings |
| **Background service worker** | Panel ↔ page message routing, script injection, downloads, screenshots, panel lifecycle |
| **Content scripts** | In-page inspection, overlay UI, and device simulation |

> **Why a relay?** The content script may not be loaded yet on some pages, and cannot run at all on restricted pages (`chrome://`, extension pages). A single routing point handles these cases centrally (see §5).

## 3. Feature modules

| Module | Behavior |
|--------|----------|
| **Element Inspector** | Overlay draws a hover/selection layer; reads `getComputedStyle` (typography, color, layout, border/effects) of the selected element, shows it in the panel, copies on one click |
| **Color Picker & Palette** | Color sampling (native `EyeDropper`, overlay fallback); auto-extract dominant palette; HEX/RGB/HSL conversion and export |
| **Asset Extraction** | Scans the page: images, SVG, icons, videos, Lottie (JSON), fonts; preview + single/bulk (ZIP) download |
| **Design System Generator** | Token extraction (color, typography, spacing, radius, shadow, gradient, breakpoint) → CSS variables / SCSS / JSON / Tailwind / Markdown export |
| **Device Simulator** | Preset device profiles (phone/tablet/desktop/watch) with viewport sizing; orientation, zoom, DPR |
| **Measurement & Ruler** | Distance between elements, pixel measurement, alignment guides |
| **Screenshot** | Visible-area or selected region/element capture → PNG |
| **Settings** | Theme, default color format, download folder name, export preferences (on-device only) |

## 4. Message protocol

The panel and content scripts send messages with a `type` field; the background routes them. Main groups:

| Group | Messages |
|-------|----------|
| Inspection | `TOGGLE_INSPECT`, `STOP_INSPECT`, `GET_INSPECT_STATUS`, `ELEMENT_CLICKED`, `INSPECTOR_STOPPED` |
| Overlay | `OPEN_OVERLAY` |
| Color | `START_COLOR_PICKER`, `COLOR_PICKED` |
| Measurement | `TOGGLE_PAGE_RULER`, `STOP_PAGE_RULER`, `RULER_STATE_CHANGED` |
| Capture | `CAPTURE_SCREENSHOT`, `CAPTURE_ELEMENT_SCREENSHOT`, `EXPORT_SECTION` |
| Download | `DOWNLOAD_IMAGE`, `DOWNLOAD_FONT` |
| Simulator | `SIMULATOR_ACTIVATE/DEACTIVATE/STATUS/CHANGE_DEVICE/TOGGLE_ORIENTATION/ZOOM` |

The typed contract is in [`../engineering/API_SPEC.md`](../engineering/API_SPEC.md) and `src/core/messaging.ts`.

## 5. Resilient messaging pattern

If the content script is not injected, `tabs.sendMessage` fails with *"receiving end does not exist"*. The fix: catch the error, inject the script, and **retry**.

```
sendMessage(tabId, msg)
  └─ "receiving end does not exist"?
       ├─ yes → inject content script → send again
       └─ no  (e.g. restricted page) → RestrictedTabError
            → tell the user: "This page can't be inspected, try a normal site."
```

Restricted pages (`chrome://`, extension pages, error pages) refuse injection; this is handled gracefully with a distinct error type.

## 6. Example flow: "read an element's CSS"

```
Panel "Inspect" → TOGGLE_INSPECT
  → background: find active tab, forward the message (inject content if needed)
  → content: overlay opens, hover/selection is listened for
User clicks an element
  → content: collects values via getComputedStyle
  → ELEMENT_CLICKED { data } → background → panel
  → panel: shows values in groups, enables copy
```

## 7. Privacy & permissions

- **Zero telemetry / server.** The extension makes no network request on its own. (Only exception: asset URLs the user chooses to download — already part of the page's source.)
- `storage` is for local user preferences only.

| Permission | Why |
|------------|-----|
| `activeTab` + `scripting` | Inject overlay/simulator scripts |
| `downloads` | Save assets to the `Peeko/` folder |
| `sidePanel` | Main UI (Firefox: `sidebarAction`) |
| `storage` | User preferences |
| `tabs` | Query the active tab, send messages, capture screenshots |
| `<all_urls>` | Work on every site |

Full rationale: [`../operations/SECURITY.md`](../operations/SECURITY.md).

## 8. Platform compatibility

- **Chrome/Firefox:** `const api = globalThis.browser?.runtime?.id ? browser : chrome;`
- UI surface: Chrome `sidePanel`, Firefox `sidebarAction`.
- The overlay is isolated from the page via **Shadow DOM**; page styles can't break the UI.

## 9. Key architectural decisions

Recorded as ADRs in [`DECISIONS.md`](DECISIONS.md): choice of WXT, zero-backend, background-relay model, Shadow DOM isolation, pure-core separation, and the single typed message contract.
