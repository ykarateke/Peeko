import { type Msg } from '../core/messaging';
import { extractPageStyles } from '../core/extract';
import { extractAssets } from '../core/assets';
import { readElementInfo } from '../core/inspect';
import { createHighlighter, type Highlighter } from '../core/highlight';

// Inspection engine: hover highlight + click-to-read. Runs in every frame.
export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main() {
    let inspecting = false;
    let highlighter: Highlighter | null = null;
    let raf = 0;
    let hovered: Element | null = null;
    let selectedEl: Element | null = null;
    const isTopFrame = window.top === window.self;

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target === hovered) return;
      hovered = target;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!highlighter || !hovered) return;
        const r = hovered.getBoundingClientRect();
        highlighter.showHover(r, `${tag(hovered)} · ${Math.round(r.width)}×${Math.round(r.height)}`);
      });
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      selectedEl = target;
      highlighter?.showSelected(target.getBoundingClientRect());
      browser.runtime
        .sendMessage({ type: 'ELEMENT_CLICKED', data: readElementInfo(target) })
        .catch(() => {});
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop(true);
    };

    const reposition = () => {
      if (highlighter && selectedEl) highlighter.showSelected(selectedEl.getBoundingClientRect());
    };

    function start() {
      if (inspecting) return;
      inspecting = true;
      highlighter = createHighlighter();
      document.documentElement.style.cursor = 'crosshair';
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition, true);
    }

    function stop(notify: boolean) {
      if (!inspecting) return;
      inspecting = false;
      if (raf) cancelAnimationFrame(raf);
      hovered = null;
      selectedEl = null;
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition, true);
      highlighter?.destroy();
      highlighter = null;
      if (notify) browser.runtime.sendMessage({ type: 'INSPECTOR_STOPPED' }).catch(() => {});
    }

    browser.runtime.onMessage.addListener((message: Msg, _sender, sendResponse) => {
      switch (message.type) {
        case 'GET_INSPECT_STATUS':
          sendResponse({ inspecting });
          return true;
        case 'TOGGLE_INSPECT':
          if (inspecting) stop(false);
          else start();
          sendResponse({ inspecting });
          return true;
        case 'STOP_INSPECT':
          stop(false);
          sendResponse({ inspecting });
          return true;
        case 'GET_PAGE_STYLES':
          if (!isTopFrame) return undefined; // only the top frame answers, avoids duplicate replies
          sendResponse(extractPageStyles(document));
          return true;
        case 'GET_PAGE_ASSETS':
          if (!isTopFrame) return undefined;
          sendResponse(extractAssets(document));
          return true;
        default:
          return undefined;
      }
    });
  },
});

function tag(el: Element): string {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  return s;
}
