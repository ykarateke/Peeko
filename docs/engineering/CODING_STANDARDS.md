# Coding Standards — Peeko

Conventions for the codebase. Enforced by ESLint + Prettier + `tsc` where possible; the rest is review discipline.

## Language & tooling

- **TypeScript, strict mode.** No implicit `any`; prefer precise types over `unknown`/`any`. Model variants with discriminated unions (as `Msg` does).
- **Prettier** owns formatting — don't hand-format; don't argue style in review.
- **ESLint** owns correctness/lint rules. Fix warnings; don't disable rules inline without a one-line reason.
- **pnpm** is the package manager. Don't add a dependency for a few lines of code; prefer the platform API or an existing helper.

## Cross-browser

- Access extension APIs through the single shim: `const api = globalThis.browser?.runtime?.id ? browser : chrome;`. Never reference `chrome.*` directly in feature code.
- Chrome `sidePanel` vs Firefox `sidebarAction` differences are isolated in the background entrypoint, not spread across the UI.

## Module boundaries (see [`TECHNICAL_DESIGN.md`](../architecture/TECHNICAL_DESIGN.md) §2)

- **Pure core (`core/**` transforms)** — exporters, color-format converters, token shaping: no DOM, no extension APIs. Data in, value out. These are the unit-tested parts.
- **Impure edges** — DOM scanning, `getComputedStyle`, injection, downloads, messaging. Keep them thin and push logic into pure functions.
- **One source of truth for messages** — all message types live in `src/core/messaging.ts`; both ends import them. Changing a message means editing that file and [`API_SPEC.md`](API_SPEC.md) together.

## React / UI

- Function components + hooks. Lazy-load panel tabs (code-splitting) so the panel stays light.
- Overlay components mount inside **Shadow DOM**; scope styles accordingly and never rely on page globals or leak into them.
- Shared components go in `src/ui/`; don't duplicate a component that already exists there.

## Naming & structure

- Message `type` values: `SCREAMING_SNAKE_CASE` (matches the protocol).
- Files/dirs: match the existing layout; feature logic under `core/<feature>/`, entrypoints under `entrypoints/`.
- Keep functions small and single-purpose; extract a pure helper before adding a branch to an impure one.

## Comments

- Comment the **why**, not the what, in one line. The code shows the what.
- Mark deliberate shortcuts with: `shortcut: <the limit>, <when to upgrade>`.

## Privacy discipline (hard rule)

- No `fetch`/`XMLHttpRequest`/`import` from a remote origin, no analytics, no telemetry. The only network activity is the user-triggered `downloads.download` of asset URLs already on the page. A PR that adds outbound traffic is rejected unless the user explicitly authorized it (see [`SECURITY.md`](../operations/SECURITY.md) and [`AGENTS.md`](../../AGENTS.md)).
