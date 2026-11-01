# Observability — Peeko

> There is **no remote observability**: no analytics, metrics, crash reporting, or logging service. That is a deliberate consequence of the zero-telemetry invariant ([`SECURITY.md`](SECURITY.md), [`../architecture/DECISIONS.md`](../architecture/DECISIONS.md) ADR-001), not an omission. Everything below is local, on the user's machine.

## What exists instead

### Local debug logging (opt-in, off by default)

- A tiny logger wrapper (`console.*`) gated behind a dev flag. **Off in production builds.** It never sends anything anywhere.
- Useful log points: the resilient-messaging relay (inject/retry/`RestrictedTabError`), script injection outcomes, download results.
- In dev (`pnpm dev`), WXT HMR + the three DevTools consoles (panel, background service worker, page) are the primary debugging surfaces.

### Where to look when something breaks

| Symptom                         | Where to inspect                                                     |
| ------------------------------- | -------------------------------------------------------------------- |
| Panel UI issue                  | Side-panel DevTools console                                          |
| Message not arriving            | Background service worker console (relay logs: inject/retry)         |
| Overlay/inspect/simulator issue | Page DevTools console (content-script context)                       |
| "Nothing happens" on a page     | Check for `RestrictedTabError` — likely a `chrome://`/extension page |
| Download didn't land            | Background console + browser Downloads list; verify `Peeko/` folder  |

## User-facing signals

Since there is no telemetry, the product surfaces problems **to the user directly**, in-UI:

- Polite, specific messages for restricted pages and failed operations (no silent failures).
- Clear empty/zero states (e.g. "no fonts found on this page").

## Health & quality signals (pre-ship, not runtime)

Because we can't observe production, quality is enforced **before** release:

- CI: lint + typecheck + exporter/color unit tests + both builds (see [`../engineering/TESTING.md`](../engineering/TESTING.md)).
- Manual smoke checklist on Chrome + Firefox each milestone.
- The Network-tab zero-request check (G1) is the one "observation" that matters and is done by hand.

## Explicitly out of scope

Remote crash reporting (e.g. Sentry), usage analytics, feature-flag services, and A/B telemetry are **not** added. If error reporting is ever wanted, it must be opt-in, local-first, and user-authorized — a decision that would need a new ADR and an update to [`SECURITY.md`](SECURITY.md).
