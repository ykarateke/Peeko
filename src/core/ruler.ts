// Drag-to-measure ruler. Full-screen Shadow-DOM overlay that captures pointer events.

export interface Ruler {
  destroy(): void;
}

export function createRuler(onExit: () => void): Ruler {
  const host = document.createElement('div');
  host.style.cssText =
    'all: initial; position: fixed; inset: 0; z-index: 2147483647; cursor: crosshair;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { display: block; }
      .layer { position: fixed; inset: 0; }
      .guide { position: fixed; background: rgba(75,116,255,0.5); pointer-events: none; }
      .guide.v { width: 1px; top: 0; bottom: 0; }
      .guide.h { height: 1px; left: 0; right: 0; }
      .line { position: fixed; height: 2px; background: #4b74ff; transform-origin: 0 50%; pointer-events: none; display: none; }
      .label {
        position: fixed; display: none; transform: translate(-50%, -140%);
        background: #4b74ff; color: #fff; padding: 2px 6px; border-radius: 4px;
        font: 600 11px/1.4 ui-monospace, Menlo, monospace; white-space: nowrap; pointer-events: none;
      }
      .hint {
        position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%);
        background: rgba(27,27,31,0.85); color: #fff; padding: 4px 10px; border-radius: 999px;
        font: 500 11px/1.4 system-ui, sans-serif; pointer-events: none;
      }
    </style>
    <div class="layer">
      <div class="guide v"></div>
      <div class="guide h"></div>
      <div class="line"></div>
      <div class="label"></div>
      <div class="hint">Drag to measure · Esc to exit</div>
    </div>
  `;
  (document.documentElement || document.body).appendChild(host);

  const gv = root.querySelector('.guide.v') as HTMLElement;
  const gh = root.querySelector('.guide.h') as HTMLElement;
  const line = root.querySelector('.line') as HTMLElement;
  const label = root.querySelector('.label') as HTMLElement;

  let start: { x: number; y: number } | null = null;

  const onMove = (e: MouseEvent) => {
    gv.style.left = `${e.clientX}px`;
    gh.style.top = `${e.clientY}px`;
    if (start) drawLine(start, { x: e.clientX, y: e.clientY });
  };
  const onDown = (e: MouseEvent) => {
    start = { x: e.clientX, y: e.clientY };
    drawLine(start, start);
  };
  const onUp = () => {
    start = null;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onExit();
  };

  function drawLine(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.round(Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    line.style.display = 'block';
    line.style.left = `${a.x}px`;
    line.style.top = `${a.y}px`;
    line.style.width = `${Math.hypot(dx, dy)}px`;
    line.style.transform = `rotate(${angle}deg)`;
    label.style.display = 'block';
    label.style.left = `${(a.x + b.x) / 2}px`;
    label.style.top = `${(a.y + b.y) / 2}px`;
    label.textContent = `${len}px · ${Math.abs(Math.round(dx))}×${Math.abs(Math.round(dy))}`;
  }

  host.addEventListener('mousemove', onMove, true);
  host.addEventListener('mousedown', onDown, true);
  window.addEventListener('mouseup', onUp, true);
  window.addEventListener('keydown', onKey, true);

  return {
    destroy() {
      host.removeEventListener('mousemove', onMove, true);
      host.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mouseup', onUp, true);
      window.removeEventListener('keydown', onKey, true);
      host.remove();
    },
  };
}
