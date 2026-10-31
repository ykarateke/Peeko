# API Spec — Internal Message Protocol

> Peeko has **no HTTP API** (zero-backend, see [`DECISIONS.md`](../architecture/DECISIONS.md) ADR-001). "API" here means the **typed message protocol** between the three execution contexts, defined once as a `Msg` discriminated union in `src/core/messaging.ts`.

## Conventions

- **Transport:** `runtime.sendMessage` / `tabs.sendMessage` via the background relay (see [`ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) §5). Panel ↔ page never talk directly.
- **Discriminator:** every message has a string `type`. Senders and receivers import the same union, so the compiler enforces shape.
- **Direction key:** P = Side Panel, B = Background, C = Content/Overlay/Simulator.
- **Errors:** a relayed send to a page with no content script triggers inject-and-retry; a restricted page yields `RestrictedTabError` surfaced to the panel.

## Message reference

### Inspection

| Message | Dir | Payload | Response / effect |
|---------|-----|---------|-------------------|
| `TOGGLE_INSPECT` | P → B → C | — | Start/stop inspect mode; overlay highlight on |
| `STOP_INSPECT` | P → B → C / B→C on panel close | — | Stop inspect mode |
| `GET_INSPECT_STATUS` | P → B → C | — | Returns current inspect on/off |
| `ELEMENT_CLICKED` | C → B → P | `{ data: ElementInfo }` | Panel renders grouped values |
| `INSPECTOR_STOPPED` | C → B → P | — | Panel reflects stopped state |

### Overlay

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `OPEN_OVERLAY` | P → B | `{ tabId?: number }` | Background injects overlay + CSS into the tab |

### Color

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `START_COLOR_PICKER` | P → B → C | — | Begin sampling (native `EyeDropper` or overlay fallback) |
| `COLOR_PICKED` | C → B → P | `{ color: string }` | Panel shows the sampled color |

### Measurement

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `TOGGLE_PAGE_RULER` | P → B → C | — | Toggle ruler/measurement mode |
| `STOP_PAGE_RULER` | P → B → C | — | Stop ruler mode |
| `RULER_STATE_CHANGED` | C → B → P | `{ active: boolean }` | Panel syncs ruler state |

### Capture

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `CAPTURE_SCREENSHOT` | P → B | — | `tabs.captureVisibleTab` → PNG |
| `CAPTURE_ELEMENT_SCREENSHOT` | P → B → C | — | Capture a selected element → PNG |
| `EXPORT_SECTION` | P → B → C | — | Capture a selected region → PNG |

### Download

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `DOWNLOAD_IMAGE` | P → B | `{ url: string; filename: string }` | `downloads.download({ filename: "Peeko/..." })` |
| `DOWNLOAD_FONT` | P → B | `{ url: string; filename: string }` | Download into `Peeko/fonts/` |

### Simulator

| Message | Dir | Payload | Effect |
|---------|-----|---------|--------|
| `SIMULATOR_ACTIVATE` | P → B → C | `{ payload? }` | Inject simulator, apply viewport |
| `SIMULATOR_DEACTIVATE` | P → B → C | — | Restore page |
| `SIMULATOR_STATUS` | P → B → C | — | Probe whether simulator is injected |
| `SIMULATOR_CHANGE_DEVICE` | P → B → C | `{ payload: deviceId }` | Switch device profile |
| `SIMULATOR_TOGGLE_ORIENTATION` | P → B → C | — | Portrait ↔ landscape |
| `SIMULATOR_ZOOM` | P → B → C | `{ payload: zoom }` | Set zoom level |

## Canonical union

```ts
type Msg =
  | { type: "TOGGLE_INSPECT" } | { type: "STOP_INSPECT" } | { type: "GET_INSPECT_STATUS" }
  | { type: "ELEMENT_CLICKED"; data: ElementInfo } | { type: "INSPECTOR_STOPPED" }
  | { type: "OPEN_OVERLAY"; tabId?: number }
  | { type: "START_COLOR_PICKER" } | { type: "COLOR_PICKED"; color: string }
  | { type: "TOGGLE_PAGE_RULER" } | { type: "STOP_PAGE_RULER" } | { type: "RULER_STATE_CHANGED"; active: boolean }
  | { type: "CAPTURE_SCREENSHOT" } | { type: "CAPTURE_ELEMENT_SCREENSHOT" } | { type: "EXPORT_SECTION" }
  | { type: "DOWNLOAD_IMAGE"; url: string; filename: string }
  | { type: "DOWNLOAD_FONT"; url: string; filename: string }
  | { type: `SIMULATOR_${"ACTIVATE"|"DEACTIVATE"|"STATUS"|"CHANGE_DEVICE"|"TOGGLE_ORIENTATION"|"ZOOM"}`; payload?: unknown };
```

`ElementInfo` (shape produced by the inspector) groups computed values into `typography`, `color`, `layout`, and `borderEffects`; the concrete type lives beside `Msg` in `src/core/messaging.ts`.

## Rules for changing the protocol

1. Edit the union in `src/core/messaging.ts` first — it is the single source of truth.
2. Update this document in the same change.
3. Prefer additive changes; a type-check failure across contexts is the intended safety net (no runtime tests for `messaging`, see [`TESTING.md`](TESTING.md)).
