import { useState } from 'react';
import { COLORS, ACCENTS, FONTS } from '../data';
import {
  PaletteIcon,
  TypeIcon,
  HeartIcon,
  EyedropperIcon,
  DownloadIcon,
  SearchIcon,
  BookmarkIcon,
} from '../icons';

/** Light color needs a visible border on a light background. */
function isLight(hex: string): boolean {
  const n = hex.replace('#', '');
  if (n.length < 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 225;
}

export function StylesPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text);
        setTimeout(() => setCopied((c) => (c === text ? null : c)), 1100);
      },
      () => {},
    );
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
        {COLORS.map((c, i) => (
          <button
            key={`${c}-${i}`}
            className={`swatch${isLight(c) ? ' is-light' : ''}${copied === c ? ' is-copied' : ''}`}
            style={{ background: c }}
            title={c}
            onClick={() => copy(c)}
          />
        ))}
      </div>

      <div className="swatch-row-sm">
        {ACCENTS.map((c, i) => (
          <button
            key={`${c}-${i}`}
            className={`swatch-sm${isLight(c) ? ' is-light' : ''}`}
            style={{ background: c }}
            title={c}
            onClick={() => copy(c)}
          />
        ))}
      </div>

      <div className="btn-row">
        <button className="btn">
          <EyedropperIcon size={14} /> Pick Color
        </button>
        <button className="btn">
          <DownloadIcon size={14} /> Export Palette
        </button>
      </div>

      {/* TYPOGRAPHY */}
      <div className="section-head section-head-gap">
        <span className="section-title">
          <TypeIcon size={14} /> TYPOGRAPHY
        </span>
      </div>

      {FONTS.map((f) => (
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
