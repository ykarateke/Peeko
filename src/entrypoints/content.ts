import { type Msg } from '../core/messaging';
import { extractPageStyles } from '../core/extract';
import { extractAssets } from '../core/assets';
import { extractTokens } from '../core/tokens';
import { readElementInfo } from '../core/inspect';
import { createHighlighter, type Highlighter } from '../core/highlight';
import { createRuler, type Ruler } from '../core/ruler';

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
    let ruler: Ruler | null = null;
    let capturePrev: {
      y: number;
      behavior: string;
      hidden: { el: HTMLElement; vis: string }[];
    } | null = null;
    const isTopFrame = window.top === window.self;

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target === hovered) return;
      hovered = target;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!highlighter || !hovered) return;
        const r = hovered.getBoundingClientRect();
        highlighter.showHover(
          r,
          `${tag(hovered)} · ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
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
      stopRuler(true); // mutually exclusive with the ruler
      inspecting = true;
      highlighter = createHighlighter();
      document.documentElement.style.cursor = 'crosshair';
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition, true);
      // Tell the panel (covers starts via keyboard command while the panel is open).
      browser.runtime.sendMessage({ type: 'INSPECTOR_STARTED' }).catch(() => {});
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

    function startRuler() {
      if (ruler) return;
      stop(true); // mutually exclusive with inspect
      ruler = createRuler(() => stopRuler(true));
      browser.runtime.sendMessage({ type: 'RULER_STATE_CHANGED', active: true }).catch(() => {});
    }

    function stopRuler(notify: boolean) {
      if (!ruler) return;
      ruler.destroy();
      ruler = null;
      if (notify)
        browser.runtime.sendMessage({ type: 'RULER_STATE_CHANGED', active: false }).catch(() => {});
    }

    function prepCapture() {
      const hidden: { el: HTMLElement; vis: string }[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *')).slice(
        0,
        5000,
      )) {
        const pos = getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') {
          hidden.push({ el, vis: el.style.visibility });
          el.style.visibility = 'hidden';
        }
      }
      capturePrev = {
        y: window.scrollY,
        behavior: document.documentElement.style.scrollBehavior,
        hidden,
      };
      document.documentElement.style.scrollBehavior = 'auto';
    }

    function endCapture() {
      if (!capturePrev) return;
      for (const h of capturePrev.hidden) h.el.style.visibility = h.vis;
      document.documentElement.style.scrollBehavior = capturePrev.behavior;
      window.scrollTo(0, capturePrev.y);
      capturePrev = null;
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
        case 'TOGGLE_PAGE_RULER':
          if (!isTopFrame) return undefined; // one ruler, in the top frame only
          if (ruler) stopRuler(false);
          else startRuler();
          sendResponse({ active: ruler !== null });
          return true;
        case 'STOP_PAGE_RULER':
          if (!isTopFrame) return undefined;
          stopRuler(false);
          sendResponse({ active: false });
          return true;
        case 'GET_PAGE_STYLES':
          if (!isTopFrame) return undefined; // only the top frame answers, avoids duplicate replies
          sendResponse(extractPageStyles(document));
          return true;
        case 'GET_PAGE_ASSETS':
          if (!isTopFrame) return undefined;
          sendResponse(extractAssets(document));
          return true;
        case 'GET_DESIGN_TOKENS':
          if (!isTopFrame) return undefined;
          sendResponse(extractTokens(document));
          return true;
        case 'GET_PAGE_METRICS':
          if (!isTopFrame) return undefined;
          sendResponse({
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
          });
          return true;
        case 'PREP_CAPTURE':
          if (!isTopFrame) return undefined;
          prepCapture();
          sendResponse({ ok: true });
          return true;
        case 'SCROLL_TO':
          if (!isTopFrame) return undefined;
          window.scrollTo(0, message.y);
          sendResponse({ ok: true });
          return true;
        case 'END_CAPTURE':
          if (!isTopFrame) return undefined;
          endCapture();
          sendResponse({ ok: true });
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
