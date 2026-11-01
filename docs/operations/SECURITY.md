# Security & Privacy — Peeko

Peeko's security model is simple because it has no backend and collects nothing. The whole posture rests on one invariant: **the extension makes no network requests of its own and ships no telemetry.**

## Data handling

- **Collected / stored off-device:** none. No accounts, no analytics, no sync, no cloud.
- **Stored on-device:** user preferences only, in `chrome.storage.local` (see [`../engineering/DATABASE.md`](../engineering/DATABASE.md)).
- **Produced on demand, not persisted:** inspected CSS, colors, tokens, assets, screenshots — handed to the user via clipboard or download, then discarded.
- **Only outbound traffic:** asset URLs the **user** chooses to download, via the `downloads` API. Those URLs already belong to the page the user is on.

This is the hard invariant from [`../architecture/DECISIONS.md`](../architecture/DECISIONS.md) ADR-001 and [`../../AGENTS.md`](../../AGENTS.md). Any change that adds a backend, SDK, remote import, or phone-home is rejected unless the user explicitly authorizes it.

## Permission rationale

| Permission                                       | Why it is needed                                      | Why it is safe                                                    |
| ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `<all_urls>` (host)                              | Inspect/extract on any site the user visits           | Scripts run only in response to user action; no auto-exfiltration |
| `activeTab` + `scripting`                        | Inject overlay/simulator into the current tab         | Injection is on-demand and user-triggered                         |
| `downloads`                                      | Save assets to the `Peeko/` folder                    | Only downloads URLs the user selected                             |
| `sidePanel` (Chrome) / `sidebarAction` (Firefox) | The main UI surface                                   | UI only                                                           |
| `storage`                                        | Persist user preferences                              | `storage.local` only; nothing leaves the device                   |
| `tabs`                                           | Query active tab, route messages, `captureVisibleTab` | No browsing-history collection                                    |

No `identity` permission (no auth). No request-header modification beyond best-effort UA simulation (ADR-008).

## Isolation & injection safety

- **Shadow DOM isolation** for the overlay: page CSS can't break the UI and the UI leaks nothing into page globals (ADR-005).
- **Restricted pages** (`chrome://`, extension pages, error pages) reject injection and are handled with `RestrictedTabError` — the extension never forces execution there.
- Content scripts are kept lightweight and avoid polluting the page's global scope.

## Threat model (brief)

- **Exfiltration:** mitigated structurally — there is no code path that sends page data to a remote server.
- **Malicious page interfering with the UI:** mitigated by Shadow DOM isolation and high `z-index`.
- **Supply chain:** keep dependencies minimal (see [`../engineering/CODING_STANDARDS.md`](../engineering/CODING_STANDARDS.md)); review additions; pin versions.

## Verification

Reviewers and CI confirm the invariant empirically: open DevTools Network while exercising every feature and confirm **no extension-initiated requests** (acceptance criterion G1 in [`../product/ACCEPTANCE_CRITERIA.md`](../product/ACCEPTANCE_CRITERIA.md)).

## Reporting

Security issues: open a private report per the repository's security policy (to be added as `SECURITY` contact before public release). Do not file exploit details in public issues.
