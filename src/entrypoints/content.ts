import { type Msg } from '../core/messaging';
import { extractPageStyles } from '../core/extract';

// M1/M2: proves the relay pipe and serves real page styles. The hover/selection
// overlay (full F1 inspect) lands later this milestone.
export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main() {
    let inspecting = false;
    const isTopFrame = window.top === window.self;

    browser.runtime.onMessage.addListener((message: Msg, _sender, sendResponse) => {
      switch (message.type) {
        case 'GET_INSPECT_STATUS':
          sendResponse({ inspecting });
          return true;
        case 'TOGGLE_INSPECT':
          inspecting = !inspecting;
          // eslint-disable-next-line no-console -- local dev signal only; no telemetry.
          console.info('[Peeko] inspect:', inspecting);
          sendResponse({ inspecting });
          return true;
        case 'GET_PAGE_STYLES':
          if (!isTopFrame) return undefined; // only the top frame answers, avoids duplicate replies
          sendResponse(extractPageStyles(document));
          return true;
        default:
          return undefined;
      }
    });
  },
});
