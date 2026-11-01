import { useState } from 'react';
import { type FontToken } from '../../../core/messaging';
import { formatColor, type ColorFormat } from '../../../core/color';
import { useCopy } from '../useCopy';
import {
  PaletteIcon,
  TypeIcon,
  HeartIcon,
  EyedropperIcon,
  DownloadIcon,
  SearchIcon,
  BookmarkIcon,
} from '../icons';

interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropperCtor {
  new (): { open: () => Promise<EyeDropperResult> };
}

const FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl'];

/** Light color needs a visible border on a light background. */
function isLight(hex: string): boolean {
  const n = hex.replace('#', '');
  if (n.length < 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 225;
}

export function StylesPanel({ colors, fonts }: { colors: string[]; fonts: FontToken[] }) {
  const [copied, copy] = useCopy();
  const [picked, setPicked] = useState<string[]>([]);
  const [fmt, setFmt] = useState<ColorFormat>('hex');

  const all = [...picked, ...colors];
  const bigColors = all.slice(0, 10);
  const accentColors = all.slice(10);

  async function pickColor() {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    // shortcut: no overlay fallback yet; relies on the native EyeDropper (Chrome/Brave/Edge).
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      setPicked((p) => (p.includes(sRGBHex) ? p : [sRGBHex, ...p]));
      copy(formatColor(sRGBHex, fmt));
    } catch {
      /* user cancelled */
    }
  }

  function exportPalette() {
    if (all.length === 0) return;
    const body = all.map((c, i) => `  --color-${i + 1}: ${formatColor(c, fmt)};`).join('\n');
    const css = `:root {\n${body}\n}\n`;
    const url = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'peeko-palette.css';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* COLORS */}
      <div className="section-head">
        <span className="section-title">
          <PaletteIcon size={14} /> COLORS
        </span>
        <button className="btn btn-sm">
          <HeartIcon size={13} /> Save Website
        </button>
      </div>

      <div className="swatch-grid">
        {bigColors.map((c, i) => (
          <button
            key={`${c}-${i}`}
            className={`swatch${isLight(c) ? ' is-light' : ''}${copied === formatColor(c, fmt) ? ' is-copied' : ''}`}
            style={{ background: c }}
            title={formatColor(c, fmt)}
            onClick={() => copy(formatColor(c, fmt))}
          />
        ))}
      </div>

      {accentColors.length > 0 && (
        <div className="swatch-row-sm">
          {accentColors.map((c, i) => (
            <button
              key={`${c}-${i}`}
              className={`swatch-sm${isLight(c) ? ' is-light' : ''}`}
              style={{ background: c }}
              title={formatColor(c, fmt)}
              onClick={() => copy(formatColor(c, fmt))}
            />
          ))}
        </div>
      )}

      <div className="format-toggle">
        {FORMATS.map((f) => (
          <button
            key={f}
            className={`fmt${fmt === f ? ' is-active' : ''}`}
            onClick={() => setFmt(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={pickColor}>
          <EyedropperIcon size={14} /> Pick Color
        </button>
        <button className="btn" onClick={exportPalette}>
          <DownloadIcon size={14} /> Export Palette
        </button>
      </div>

      {/* TYPOGRAPHY */}
      <div className="section-head section-head-gap">
        <span className="section-title">
          <TypeIcon size={14} /> TYPOGRAPHY
        </span>
      </div>

      {fonts.map((f) => (
        <div className="font-card" key={f.name}>
          <div className="font-card-head">
            <div>
              <div className="font-name">{f.name}</div>
              <div className="font-role">{f.role}</div>
            </div>
            <div className="font-actions">
              <button className="chip-btn" title="Preview">
                <SearchIcon size={14} />
              </button>
              <button className="chip-btn" title="Save font">
                <BookmarkIcon size={14} />
              </button>
            </div>
          </div>

          <button
            className={`code-row${copied === f.css ? ' is-copied' : ''}`}
            onClick={() => copy(f.css)}
          >
            <code>{f.css}</code>
            <span className="code-tag">{copied === f.css ? 'Copied' : 'CSS'}</span>
          </button>
          <button
            className={`code-row${copied === f.tw ? ' is-copied' : ''}`}
            onClick={() => copy(f.tw)}
          >
            <code>{f.tw}</code>
            <span className="code-tag">{copied === f.tw ? 'Copied' : 'TW'}</span>
          </button>

          <div className="weight-row">
            {f.weights.map((w) => (
              <span className="weight-chip" key={w} style={{ fontWeight: w }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
