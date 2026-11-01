// In-page highlight for the inspector. Shadow DOM isolated so page CSS can't touch it (ADR-005).

export interface Highlighter {
  showHover(rect: DOMRect, label: string): void;
  showSelected(rect: DOMRect): void;
  clearHover(): void;
  destroy(): void;
}

export function createHighlighter(): Highlighter {
  const host = document.createElement('div');
  host.style.cssText =
    'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      .box { position: fixed; pointer-events: none; box-sizing: border-box; display: none; }
      .hover { border: 1px solid #4b74ff; background: rgba(75, 116, 255, 0.12); }
      .selected { border: 2px solid #4b74ff; }
      .label {
        position: fixed; display: none; transform: translateY(-100%);
        background: #4b74ff; color: #fff; padding: 2px 6px; border-radius: 4px 4px 4px 0;
        font: 600 11px/1.4 ui-monospace, Menlo, monospace; white-space: nowrap; pointer-events: none;
      }
    </style>
    <div class="box hover"></div>
    <div class="box selected"></div>
    <div class="label"></div>
  `;
  (document.documentElement || document.body).appendChild(host);

  const hover = root.querySelector('.hover') as HTMLElement;
  const selected = root.querySelector('.selected') as HTMLElement;
  const label = root.querySelector('.label') as HTMLElement;

  const place = (box: HTMLElement, r: DOMRect) => {
    box.style.display = 'block';
    box.style.left = `${r.left}px`;
    box.style.top = `${r.top}px`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
  };

  return {
    showHover(r, text) {
      place(hover, r);
      label.style.display = 'block';
      label.textContent = text;
      label.style.left = `${r.left}px`;
      label.style.top = `${Math.max(r.top, 16)}px`;
    },
    showSelected(r) {
      place(selected, r);
    },
    clearHover() {
      hover.style.display = 'none';
      label.style.display = 'none';
    },
    destroy() {
      host.remove();
    },
  };
}
