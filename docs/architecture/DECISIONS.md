# Architecture Decision Records — Peeko

Short ADRs capturing the choices that shape the codebase. Format: Context → Decision → Consequences. Status is `Accepted` unless noted.

## ADR-001 — Zero backend, local-first

**Context.** The product is a design-inspection tool; users inspect sites they visit. A backend would add cost, privacy risk, and a trust barrier.
**Decision.** No server, accounts, login, sync, or payment. All processing happens in the browser. The extension makes no network requests of its own; the only outbound traffic is user-triggered asset downloads (URLs already on the page).
**Consequences.** No `identity` permission. No DB — preferences live in `chrome.storage.local`. Strong privacy story and a simple threat model, at the cost of cross-device sync (out of scope). This is a hard invariant (see [`AGENTS.md`](../../AGENTS.md)).

## ADR-002 — WXT as the extension framework

**Context.** We need MV3 support for both Chrome and Firefox from one codebase, with good DX and Shadow DOM tooling.
**Decision.** Use [WXT](https://wxt.dev) (Vite under the hood). Use its `createIsolatedElement` / `shadowDom` for in-page UI and its multi-target build.
**Consequences.** One source, two build outputs (`.output/chrome-mv3`, `.output/firefox-mv3`), HMR in dev. We accept dependence on WXT's conventions (entrypoints layout, manifest generation).

## ADR-003 — React + TypeScript for UI

**Context.** The panel and overlay are non-trivial UIs with shared components.
**Decision.** React + TypeScript for both the side panel and the overlay; shared components in `src/ui/`.
**Consequences.** Code-splitting via Vite (lazy-load panel tabs). Overlay React must mount inside Shadow DOM.

## ADR-004 — Background service worker as central relay

**Context.** In MV3 the side panel and page content scripts cannot message each other directly; content scripts may be absent or forbidden on a page.
**Decision.** Route all panel ↔ page messages through the background service worker, with a resilient pattern: on _"receiving end does not exist"_, inject the content script and retry; on restricted pages raise `RestrictedTabError`.
**Consequences.** One place handles injection, retries, and restricted-page errors. All features depend on this relay being correct (see [`ARCHITECTURE.md`](ARCHITECTURE.md) §5).

## ADR-005 — Shadow DOM isolation for in-page UI

**Context.** The overlay runs inside arbitrary pages with unpredictable, aggressive CSS.
**Decision.** Mandate Shadow DOM isolation for the overlay (WXT `createIsolatedElement` / `shadowDom: true`), with a very high `z-index`.
**Consequences.** Page styles can't break the UI and the UI leaks nothing into page globals. Styling must be scoped; some global CSS techniques don't apply inside the shadow root.

## ADR-006 — Single typed message contract

**Context.** Messages cross three contexts; drift between senders and receivers is a common extension bug.
**Decision.** Define one `Msg` discriminated union in `src/core/messaging.ts` as the single source of truth; both ends import it.
**Consequences.** Compile-time safety across contexts; `messaging` needs no runtime tests (type-check suffices). See [`../engineering/API_SPEC.md`](../engineering/API_SPEC.md).

## ADR-007 — Pure core, impure edges

**Context.** DOM-dependent code is hard to test; export/format logic is pure and valuable to verify.
**Decision.** Separate DOM scanning (token/asset _extraction_) from pure transforms (exporters, color conversions). Pure modules take data in and return strings/objects out.
**Consequences.** Exporters and color-format functions are unit-tested; DOM/overlay/simulator rely on manual smoke tests. See [`../engineering/TESTING.md`](../engineering/TESTING.md).

## ADR-008 — Device simulation over UA spoofing

**Context.** MV3 restricts request-header modification, limiting true UA spoofing.
**Decision.** Primary responsive testing is viewport/DPR/orientation simulation. UA spoofing is best-effort via `declarativeNetRequest` where feasible.
**Consequences.** Simulator works everywhere via viewport; UA-dependent server behavior may not change. Documented as a known limitation (P2 to improve).

## ADR-009 — MIT license

**Context.** The project is open-source and wants the widest, lowest-friction adoption and contribution.
**Decision.** License under **MIT**. A `LICENSE` file at the repo root is the canonical text.
**Consequences.** Permissive reuse; no patent grant (acceptable for a client-only extension). All docs reference MIT.

## Open / deferred

- **Styling:** CSS Modules vs Tailwind for the overlay — optional; isolation requirement stands either way.
