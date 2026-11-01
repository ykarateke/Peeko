import { browser } from 'wxt/browser';
import { type ElementInfo } from '../../../core/messaging';
import { useCopy } from '../useCopy';
import { triggerDownload } from '../download';
import { CursorIcon } from '../icons';

type GroupKey = 'typography' | 'color' | 'layout' | 'borderEffects';

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'typography', label: 'TYPOGRAPHY' },
  { key: 'color', label: 'COLOR' },
  { key: 'layout', label: 'LAYOUT' },
  { key: 'borderEffects', label: 'BORDER & EFFECTS' },
];

const isColor = (v: string) => /^(#|rgb|hsl)/i.test(v);

interface Props {
  info: ElementInfo | null;
  inspecting: boolean;
  onToggle: () => void;
}

export function InspectPanel({ info, inspecting, onToggle }: Props) {
  const [copied, copy] = useCopy();

  function copyCss() {
    if (!info) return;
    const lines: string[] = [];
    for (const g of GROUPS) {
      for (const [k, v] of Object.entries(info[g.key])) lines.push(`  ${k}: ${v};`);
    }
    copy(`${info.selector} {\n${lines.join('\n')}\n}`);
  }

  async function screenshot() {
    if (!info) return;
    const res = (await browser.runtime
      .sendMessage({ type: 'CAPTURE_SCREENSHOT' })
      .catch(() => null)) as { ok?: boolean; data?: string } | null;
    if (!res?.ok || !res.data) return;
    const img = new Image();
    img.onload = () => {
      const dpr = info.dpr || 1;
      const { x, y, width, height } = info.rect;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // crop the captured viewport to the element's box (element must be in view)
      ctx.drawImage(img, Math.round(x * dpr), Math.round(y * dpr), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        triggerDownload(url, 'peeko-element.png');
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = res.data;
  }

  return (
    <>
      <button
        className={`btn inspect-toggle${inspecting ? ' is-on' : ''}`}
        onClick={onToggle}
      >
        <CursorIcon size={14} /> {inspecting ? 'Stop inspecting' : 'Start inspecting'}
      </button>

      {!info ? (
        <div className="placeholder">
          <p className="placeholder-title">{inspecting ? 'Pick an element' : 'Nothing selected'}</p>
          <p className="placeholder-sub">
            {inspecting ? 'Hover the page and click an element.' : 'Start inspecting, then click an element.'}
          </p>
        </div>
      ) : (
        <>
          <div className="inspect-head">
            <code className="inspect-selector" title={info.selector}>
              {info.selector}
            </code>
            <span className="inspect-box">{info.box}</span>
            <button className="btn btn-sm" onClick={copyCss} title="Copy all as CSS">
              {copied?.startsWith(info.selector) ? 'Copied' : 'Copy CSS'}
            </button>
            <button className="btn btn-sm" onClick={screenshot} title="Screenshot element (must be in view)">
              PNG
            </button>
          </div>

          {GROUPS.map((g) => {
            const entries = Object.entries(info[g.key]);
            if (entries.length === 0) return null;
            return (
              <div className="prop-group" key={g.key}>
                <div className="section-title prop-group-title">{g.label}</div>
                {entries.map(([k, v]) => (
                  <button
                    key={k}
                    className={`prop-row${copied === v ? ' is-copied' : ''}`}
                    onClick={() => copy(v)}
                    title="Copy value"
                  >
                    <span className="prop-key">{k}</span>
                    <span className="prop-val">
                      {isColor(v) && <span className="prop-swatch" style={{ background: v }} />}
                      {copied === v ? 'Copied' : v}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
