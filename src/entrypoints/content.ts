import { type Msg } from '../core/messaging';

// M1 skeleton: proves the relay pipe works. The real inspection engine
// (hover/selection, getComputedStyle) lands in M2.
export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main() {
    let inspecting = false;

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
        default:
          return undefined;
      }
    });
  },
});
