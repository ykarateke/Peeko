import { browser } from 'wxt/browser';
import { type Msg, RestrictedTabError } from '../core/messaging';

// WXT's `browser` is the cross-browser accessor (the documented
// `globalThis.browser?.runtime?.id ? browser : chrome` shim).

export default defineBackground(() => {
  // Chrome: open the side panel when the toolbar icon is clicked.
  browser.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    .catch(() => {});

  // Panel -> page messages are relayed here with inject-and-retry.
  // M1: the Styles panel uses mock data; only the Inspect toggle exercises this path.
  browser.runtime.onMessage.addListener((message: Msg, _sender, sendResponse) => {
    if (message.type === 'TOGGLE_INSPECT') {
      relayToActiveTab(message)
        .then((res) => sendResponse({ ok: true, res }))
        .catch((err: unknown) =>
          sendResponse({ ok: false, error: errorKind(err) }),
        );
      return true; // async response
    }
    return undefined;
  });
});

/** Send a message to the active tab; if the content script isn't there yet, inject it and retry. */
async function relayToActiveTab(message: Msg): Promise<unknown> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || isRestrictedUrl(tab.url)) throw new RestrictedTabError();
  const tabId = tab.id;

  try {
    return await browser.tabs.sendMessage(tabId, message);
  } catch (err) {
    if (!isNoReceiver(err)) throw err;
    // Content script not injected yet — inject and retry once.
    try {
      await browser.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['/content-scripts/content.js'],
      });
    } catch {
      throw new RestrictedTabError();
    }
    return await browser.tabs.sendMessage(tabId, message);
  }
}

function isNoReceiver(err: unknown): boolean {
  return (
    err instanceof Error &&
    /receiving end does not exist/i.test(err.message)
  );
}

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return /^(chrome|edge|about|moz-extension|chrome-extension|view-source|devtools):/i.test(
    url,
  );
}

function errorKind(err: unknown): string {
  return err instanceof RestrictedTabError ? 'RESTRICTED_TAB' : 'UNKNOWN';
}
