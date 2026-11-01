import { browser } from 'wxt/browser';
import {
  type Msg,
  type PageMetrics,
  type CaptureTile,
  RestrictedTabError,
} from '../core/messaging';
import { tileOffsets } from '../core/capture-math';

const MAX_TILES = 40;
const CAPTURE_DELAY = 400; // ms between captureVisibleTab calls (rate limit + lazy load)
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  'GET_PAGE_HTML',
  'TOGGLE_PAGE_RULER',
  'STOP_PAGE_RULER',
]);

export default defineBackground(() => {
  // Chrome: open the side panel when the toolbar icon is clicked.
  browser.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});

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
    if (message.type === 'CAPTURE_FULL_PAGE') {
      captureFullPage()
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err: unknown) => sendResponse({ ok: false, error: errorKind(err) }));
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
    await injectContent(tabId);
    return await browser.tabs.sendMessage(tabId, message);
  }
}

async function injectContent(tabId: number): Promise<void> {
  try {
    await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['/content-scripts/content.js'],
    });
  } catch {
    throw new RestrictedTabError();
  }
}

/**
 * Full-page screenshot via scroll-and-stitch. Captures in a **temporary full-width window**
 * (not the current tab) so the side panel doesn't narrow the page — the page reloads there,
 * so interactive/logged-in state is not preserved.
 */
async function captureFullPage(): Promise<{ metrics: PageMetrics; tiles: CaptureTile[] }> {
  const [active] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!active?.url || isRestrictedUrl(active.url)) throw new RestrictedTabError();
  const originalWindowId = active.windowId;

  const win = await browser.windows.create({ url: active.url, focused: true, state: 'maximized' });
  const winId = win?.id;
  const tabId = win?.tabs?.[0]?.id;
  if (winId === undefined || tabId === undefined) throw new Error('Could not open capture window.');

  const send = async (msg: Msg): Promise<unknown> => {
    try {
      return await browser.tabs.sendMessage(tabId, msg);
    } catch (err) {
      if (!isNoReceiver(err)) throw err;
      await injectContent(tabId);
      return browser.tabs.sendMessage(tabId, msg);
    }
  };

  try {
    await waitForComplete(tabId);
    await delay(900); // settle layout + initial lazy-load
    const metrics = (await send({ type: 'GET_PAGE_METRICS' })) as PageMetrics;
    await send({ type: 'PREP_CAPTURE' });
    const tiles: CaptureTile[] = [];
    try {
      const offsets = tileOffsets(metrics.scrollHeight, metrics.innerHeight).slice(0, MAX_TILES);
      for (const y of offsets) {
        await send({ type: 'SCROLL_TO', y });
        await delay(CAPTURE_DELAY);
        tiles.push({ y, dataUrl: await browser.tabs.captureVisibleTab(winId, { format: 'png' }) });
      }
    } finally {
      await send({ type: 'END_CAPTURE' }).catch(() => {});
    }
    return { metrics, tiles };
  } finally {
    await browser.windows.remove(winId).catch(() => {});
    await browser.windows.update(originalWindowId, { focused: true }).catch(() => {});
  }
}

/** Resolve once a tab finishes loading (bounded wait). */
function waitForComplete(tabId: number, timeout = 15000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = async () => {
      try {
        const t = await browser.tabs.get(tabId);
        if (t.status === 'complete' || Date.now() - start > timeout) return resolve();
      } catch {
        return resolve();
      }
      setTimeout(check, 200);
    };
    check();
  });
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
