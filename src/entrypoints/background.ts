import { browser } from 'wxt/browser';
import { type Msg, RestrictedTabError } from '../core/messaging';

// WXT's `browser` is the cross-browser accessor (the documented
// `globalThis.browser?.runtime?.id ? browser : chrome` shim).

// Panel -> page messages that the background forwards to the active tab.
const RELAYED: ReadonlySet<Msg['type']> = new Set([
  'TOGGLE_INSPECT',
  'STOP_INSPECT',
  'GET_INSPECT_STATUS',
  'GET_PAGE_STYLES',
  'GET_PAGE_ASSETS',
  'GET_DESIGN_TOKENS',
  'TOGGLE_PAGE_RULER',
  'STOP_PAGE_RULER',
]);

export default defineBackground(() => {
  // Chrome: open the side panel when the toolbar icon is clicked.
  browser.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    .catch(() => {});

  // Keyboard shortcut (Alt+Shift+I) -> toggle the inspector on the active tab.
  browser.commands?.onCommand.addListener((command) => {
    if (command === 'toggle-inspect') relayToActiveTab({ type: 'TOGGLE_INSPECT' }).catch(() => {});
  });

  browser.runtime.onMessage.addListener((message: Msg, _sender, sendResponse) => {
    if (message.type === 'DOWNLOAD_IMAGE' || message.type === 'DOWNLOAD_FONT') {
      browser.downloads
        .download({ url: message.url, filename: message.filename })
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
    if (message.type === 'CAPTURE_SCREENSHOT') {
      browser.tabs
        .captureVisibleTab({ format: 'png' })
        .then((dataUrl) => sendResponse({ ok: true, data: dataUrl }))
        .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
    if (message.type === 'SIMULATOR_ACTIVATE') {
      openDeviceWindow(message.payload)
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
    if (RELAYED.has(message.type)) {
      relayToActiveTab(message)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err: unknown) => sendResponse({ ok: false, error: errorKind(err) }));
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

/** Open the active tab's URL in a device-sized popup window. */
async function openDeviceWindow(payload: unknown): Promise<void> {
  const size = payload as { width?: number; height?: number };
  const width = Math.round(size?.width ?? 390);
  const height = Math.round(size?.height ?? 844);
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || isRestrictedUrl(tab.url)) throw new RestrictedTabError();
  await browser.windows.create({ url: tab.url, type: 'popup', width, height });
}

function isNoReceiver(err: unknown): boolean {
  return err instanceof Error && /receiving end does not exist/i.test(err.message);
}

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return /^(chrome|edge|about|moz-extension|chrome-extension|view-source|devtools):/i.test(url);
}

function errorKind(err: unknown): string {
  return err instanceof RestrictedTabError ? 'RESTRICTED_TAB' : 'UNKNOWN';
}
