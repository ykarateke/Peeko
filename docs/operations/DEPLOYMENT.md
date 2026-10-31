# Deployment — Peeko

Peeko ships as a browser extension to the Chrome Web Store and Firefox Add-ons (AMO). There is no server to deploy (zero-backend).

## Builds

| Command | Output |
|---------|--------|
| `pnpm build` | `.output/chrome-mv3` |
| `pnpm build:firefox` | `.output/firefox-mv3` |

WXT generates the per-target manifest (MV3). Packaging to a distributable zip is done with `wxt zip` / `wxt zip:firefox` (produces the upload artifacts).

## Pre-release checklist

- [ ] Both builds green; `pnpm lint`, `pnpm typecheck`, `pnpm test` pass (see [`../engineering/TESTING.md`](../engineering/TESTING.md)).
- [ ] Manual smoke checklist passed on Chrome **and** Firefox.
- [ ] DevTools Network confirms zero extension-initiated requests.
- [ ] Version bumped and [`../../CHANGELOG.md`](../../CHANGELOG.md) updated.
- [ ] `LICENSE` (MIT) present in the repo.
- [ ] README justifies `<all_urls>` and download permissions (reviewers check this).
- [ ] Store listing assets ready: icons, screenshots, description, privacy summary.

## Chrome Web Store

1. Build + zip the Chrome target.
2. Upload to the Chrome Web Store Developer Dashboard.
3. Fill the privacy practices form: declare **no data collected / no data sold** (true — zero telemetry). Justify each permission (see [`SECURITY.md`](SECURITY.md)).
4. Submit for review.

## Firefox Add-ons (AMO)

1. Build + zip the Firefox target.
2. Upload to AMO (`addons.mozilla.org`). The UI surface uses `sidebarAction`.
3. AMO reviews source for minified/obfuscated code — provide readable source / build instructions if requested.
4. Submit for review.

## Versioning

Semantic Versioning, mirrored in the manifest `version` and [`../../CHANGELOG.md`](../../CHANGELOG.md). Tag releases in git (`vX.Y.Z`). Keep Chrome and Firefox listings on the same version number.

## Rollback

Each store keeps prior approved versions; roll back by re-publishing the last-good version (or submitting a patch). No infrastructure/runtime rollback exists because there is no backend.
