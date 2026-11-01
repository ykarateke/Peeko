import { useState } from 'react';
import {
  type ColorToken,
  type ColorGroup,
  type DesignTokens,
  type Count,
  type TypeStyleToken,
} from '../../../core/messaging';
import { wcagLevel } from '../../../core/color';
import { parseEasing, easingPath } from '../../../core/easing';
import { scaleName } from '../../../core/classify';
import { useCopy } from '../useCopy';
import { Inspector, OriginBadge, type InspectorRow } from './Inspector';

const GROUP_ORDER: ColorGroup[] = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'border',
  'success',
  'warning',
  'error',
  'info',
  'other',
];
const GROUP_LABEL: Record<ColorGroup, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
  border: 'Border',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
  other: 'Other',
};

const NAV = [
  ['sec-overview', 'Overview'],
  ['sec-colors', 'Colors'],
  ['sec-type', 'Type'],
  ['sec-spacing', 'Spacing'],
  ['sec-effects', 'Effects'],
  ['sec-tokens', 'Tokens'],
] as const;

function isLight(hex: string): boolean {
  const n = hex.replace('#', '');
  if (n.length < 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 225;
}
const px = (v: string) => parseFloat(v) || 0;

type Inspect =
  { kind: 'color'; token: ColorToken } | { kind: 'type'; token: TypeStyleToken } | null;

export function DesignOverview({ tokens: t }: { tokens: DesignTokens }) {
  const [copied, copy] = useCopy();
  const [group, setGroup] = useState<ColorGroup | 'all'>('all');
  const [inspect, setInspect] = useState<Inspect>(null);

  const family = t.fontFamilies[0] ?? 'inherit';
  const grouped = GROUP_ORDER.map((g) => ({
    g,
    items: t.colorTokens.filter((c) => c.group === g),
  })).filter((x) => x.items.length > 0);
  const shownGroups = group === 'all' ? grouped : grouped.filter((x) => x.g === group);

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="dov">
      <nav className="dov-nav">
        {NAV.map(([id, label]) => (
          <button key={id} className="dov-nav-btn" onClick={() => jump(id)}>
            {label}
          </button>
        ))}
      </nav>

      {/* A. Overview */}
      <div id="sec-overview">
        <div className="stat-tiles">
          <Stat n={t.overview.counts.colors} label="colors" />
          <Stat n={t.overview.counts.typography} label="type styles" />
          <Stat n={t.overview.counts.components} label="components" />
          <Stat n={t.overview.counts.tokens} label="tokens" />
          <Stat n={t.spacing.length} label="spacing" />
          <Stat n={t.meta.elementCount} label="elements" />
        </div>
        <div className="ds-summary">
          <div className="ds-style">
            <span className="ds-style-label">{t.overview.style.label}</span>
            <span className="conf">
              style · {Math.round(t.overview.style.confidence * 100)}% (inferred)
            </span>
          </div>
          <div className="ds-score">
            <div className="ds-score-bar">
              <span style={{ width: `${t.overview.consistencyScore}%` }} />
            </div>
            <span className="ds-score-n">{t.overview.consistencyScore}/100 consistency</span>
          </div>
        </div>
        {t.overview.characteristics.length > 0 && (
          <div className="chip-previews">
            {t.overview.characteristics.map((c) => (
              <span className="dur-chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="dov-url" title={t.meta.url}>
          {t.meta.url}
        </div>
      </div>

      {/* B. Color System */}
      <div id="sec-colors" className="dov-sec">
        <div className="section-title dov-h">Color system</div>
        <div className="filter-row">
          <button
            className={`filter-chip${group === 'all' ? ' is-active' : ''}`}
            onClick={() => setGroup('all')}
          >
            All <span className="filter-count">{t.colorTokens.length}</span>
          </button>
          {grouped.map((x) => (
            <button
              key={x.g}
              className={`filter-chip${group === x.g ? ' is-active' : ''}`}
              onClick={() => setGroup(x.g)}
            >
              {GROUP_LABEL[x.g]} <span className="filter-count">{x.items.length}</span>
            </button>
          ))}
        </div>
        {shownGroups.map((x) => (
          <div className="color-group" key={x.g}>
            <div className="color-group-h">{GROUP_LABEL[x.g]}</div>
            <div className="color-cards">
              {x.items.map((c) => (
                <button
                  key={c.cssVar}
                  className="color-card"
                  onClick={() => setInspect({ kind: 'color', token: c })}
                >
                  <span
                    className={`color-card-sw${isLight(c.hex) ? ' is-light' : ''}`}
                    style={{ background: c.hex }}
                  />
                  <span className="color-card-meta">
                    <span className="color-card-hex">{c.hex}</span>
                    <span className="color-card-sub">
                      {c.occurrences}× {c.similarTo && '· dup'}
                    </span>
                  </span>
                  <OriginBadge origin={c.origin} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* C. Typography */}
      <div id="sec-type" className="dov-sec">
        <div className="section-title dov-h">Typography</div>
        <div className="type-families">{t.fontFamilies.join(' · ') || '—'}</div>
        <div className="type-scale">
          {t.textStyles.map((s) => (
            <button
              className="type-style-row"
              key={s.name}
              onClick={() => setInspect({ kind: 'type', token: s })}
            >
              <span
                className="type-sample"
                style={{
                  fontFamily: family,
                  fontSize: Math.min(px(s.size), 32),
                  fontWeight: Number(s.weight) || undefined,
                }}
              >
                {s.name}
              </span>
              <span className="type-size">{s.size}</span>
              <OriginBadge origin={s.origin} />
            </button>
          ))}
        </div>
        {t.fontWeights.length > 0 && (
          <div className="weight-row">
            {t.fontWeights.map((w) => (
              <span className="weight-chip" key={w} style={{ fontWeight: w }}>
                {w}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* D. Spacing & layout */}
      <div id="sec-spacing" className="dov-sec">
        <div className="section-title dov-h">Spacing</div>
        {t.usage.spacing.length > 0 && <BarList rows={t.usage.spacing} baseUnit={t.baseUnit} />}
        {t.spacingNormalized.length > 0 && (
          <>
            <div className="sub-h">
              Normalized scale <OriginBadge origin="normalized" />
            </div>
            <div className="chip-previews">
              {t.spacingNormalized.map((s, i) => (
                <span className="dur-chip" key={s.value}>
                  {scaleName(i)} · {s.value}
                </span>
              ))}
            </div>
          </>
        )}
        {t.breakpoints.length > 0 || t.containers.length > 0 ? (
          <>
            <div className="sub-h">Breakpoints &amp; container</div>
            <BpRuler breakpoints={t.breakpoints} containers={t.containers} />
          </>
        ) : null}
      </div>

      {/* E. Effects */}
      {(t.radii.length > 0 ||
        t.shadows.length > 0 ||
        t.gradients.length > 0 ||
        t.easings.length > 0) && (
        <div id="sec-effects" className="dov-sec">
          <div className="section-title dov-h">Effects</div>
          {t.radii.length > 0 && (
            <div className="chip-previews">
              {t.radii.map((r) => (
                <div className="radii-item" key={r}>
                  <span className="radii-box" style={{ borderRadius: r }} />
                  <span className="chip-label">{r}</span>
                </div>
              ))}
            </div>
          )}
          {t.shadows.length > 0 && (
            <div className="shadow-previews">
              {t.shadows.map((s, i) => (
                <div className="shadow-box" key={i} style={{ boxShadow: s }} title={s} />
              ))}
            </div>
          )}
          {t.easings.length > 0 && (
            <div className="ease-previews">
              {t.easings.map((e) => {
                const b = parseEasing(e);
                return (
                  <div className="ease-item" key={e} title={e}>
                    <svg viewBox="0 0 40 40" className="ease-svg" aria-hidden="true">
                      <line x1="0" y1="40" x2="40" y2="0" className="ease-base" />
                      {b && <path d={easingPath(b, 40)} className="ease-curve" />}
                    </svg>
                    <span className="chip-label">{e.replace('cubic-bezier', 'cb')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive preview */}
      <div className="dov-sec">
        <div className="section-title dov-h">Preview</div>
        <PreviewBoard t={t} />
      </div>

      {/* F. Components (Phase 2) */}
      <div className="dov-sec">
        <div className="section-title dov-h">Components</div>
        <p className="view-note">
          Component library (variants, states, screenshots) — coming in the next phase.
        </p>
      </div>

      {/* G. Tokens table */}
      <div id="sec-tokens" className="dov-sec">
        <div className="section-title dov-h">Design tokens</div>
        <TokenTable t={t} copied={copied} onCopy={copy} />
      </div>

      {inspect?.kind === 'color' && (
        <ColorInspector
          token={inspect.token}
          copied={copied}
          onCopy={copy}
          onClose={() => setInspect(null)}
        />
      )}
      {inspect?.kind === 'type' && (
        <TypeInspector
          token={inspect.token}
          copied={copied}
          onCopy={copy}
          onClose={() => setInspect(null)}
        />
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-n">{n}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

function BarList({ rows, baseUnit }: { rows: Count[]; baseUnit?: string | null }) {
  const m = Math.max(...rows.map((r) => px(r.value)), 1);
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.value} title={`${r.value} · used ${r.count}×`}>
          <div className="bar-track">
            <span
              className={`bar-fill bar-accent${baseUnit === r.value ? ' is-base' : ''}`}
              style={{ width: `${Math.max((px(r.value) / m) * 100, 3)}%` }}
            />
          </div>
          <span className="bar-label">
            {r.value}
            <span className="bar-count">{r.count}×</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function BpRuler({ breakpoints, containers }: { breakpoints: string[]; containers: string[] }) {
  const marks = [
    ...breakpoints.map((v) => ({ v, px: px(v), kind: 'bp' as const })),
    ...containers.map((v) => ({ v, px: px(v), kind: 'container' as const })),
  ].filter((m) => m.px > 0);
  if (marks.length === 0) return null;
  const hi = Math.max(...marks.map((m) => m.px));
  return (
    <div className="bp-ruler">
      <div className="bp-track">
        {marks.map((m, i) => (
          <span
            key={`${m.v}-${i}`}
            className={`bp-tick ${m.kind}`}
            style={{ left: `${(m.px / hi) * 100}%` }}
            title={`${m.kind}: ${m.v}`}
          />
        ))}
      </div>
      <div className="bp-labels">
        {marks.map((m, i) => (
          <span key={`${m.v}-${i}`} className="bp-label" style={{ left: `${(m.px / hi) * 100}%` }}>
            {m.v}
          </span>
        ))}
      </div>
    </div>
  );
}

function ColorInspector({
  token: c,
  copied,
  onCopy,
  onClose,
}: {
  token: ColorToken;
  copied: string | null;
  onCopy: (t: string) => void;
  onClose: () => void;
}) {
  const rows: InspectorRow[] = [
    { label: 'HEX', value: c.hex, copyable: true },
    { label: 'RGB', value: c.rgb, copyable: true },
    { label: 'HSL', value: c.hsl, copyable: true },
    { label: 'CSS var', value: `${c.cssVar}: ${c.hex};`, copyable: true },
    { label: 'Group', value: c.group },
    { label: 'Occurrences', value: `${c.occurrences}` },
    { label: 'On white', value: `${c.onLight}:1 (${wcagLevel(c.onLight)})` },
    { label: 'On dark', value: `${c.onDark}:1 (${wcagLevel(c.onDark)})` },
  ];
  return (
    <Inspector
      title={c.hex}
      swatch={c.hex}
      origin={c.origin}
      confidence={c.confidence}
      rows={rows}
      note={c.similarTo ? `Near-duplicate of ${c.similarTo} — consider merging.` : undefined}
      copied={copied}
      onCopy={onCopy}
      onClose={onClose}
    />
  );
}

function TypeInspector({
  token: s,
  copied,
  onCopy,
  onClose,
}: {
  token: TypeStyleToken;
  copied: string | null;
  onCopy: (t: string) => void;
  onClose: () => void;
}) {
  const css = `font-size: ${s.size};\nfont-weight: ${s.weight};\nline-height: ${s.lineHeight};${s.letterSpacing ? `\nletter-spacing: ${s.letterSpacing};` : ''}`;
  const rows: InspectorRow[] = [
    { label: 'Size', value: s.size },
    { label: 'Weight', value: s.weight },
    { label: 'Line height', value: s.lineHeight },
    ...(s.letterSpacing ? [{ label: 'Letter spacing', value: s.letterSpacing }] : []),
    ...(s.source ? [{ label: 'Source', value: s.source }] : []),
    { label: 'CSS', value: css, copyable: true },
  ];
  return (
    <Inspector
      title={s.name}
      origin={s.origin}
      rows={rows}
      copied={copied}
      onCopy={onCopy}
      onClose={onClose}
    />
  );
}

function PreviewBoard({ t }: { t: DesignTokens }) {
  const bg = t.roles.background ?? '#ffffff';
  const text = t.roles.text ?? t.bodyColor ?? '#111111';
  const accent =
    t.roles.accent ?? t.colorTokens.find((c) => c.group === 'primary')?.hex ?? '#4b74ff';
  const radius = t.radii[0] ?? '8px';
  const h1 = t.textStyles.find((s) => s.name === 'Display' || s.name === 'H1');
  const body = t.textStyles.find((s) => s.name === 'Body');
  return (
    <div className="preview-board" style={{ background: bg, color: text, borderRadius: radius }}>
      <div
        style={{
          fontFamily: t.fontFamilies[0],
          fontSize: Math.min(px(h1?.size ?? '24px'), 26),
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {t.meta.title || 'Heading'}
      </div>
      <div
        style={{ fontSize: Math.min(px(body?.size ?? '14px'), 14), opacity: 0.85, marginTop: 4 }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>
      <div className="preview-actions">
        <span
          className="pv-btn"
          style={{ background: accent, color: '#fff', borderRadius: radius }}
        >
          Primary
        </span>
        <span
          className="pv-btn"
          style={{
            background: 'transparent',
            color: accent,
            border: `1px solid ${accent}`,
            borderRadius: radius,
          }}
        >
          Secondary
        </span>
        <span className="pv-badge" style={{ background: accent, borderRadius: 999 }}>
          Badge
        </span>
      </div>
      <div className="pv-input" style={{ borderRadius: radius }}>
        Input field
      </div>
    </div>
  );
}

function TokenTable({
  t,
  copied,
  onCopy,
}: {
  t: DesignTokens;
  copied: string | null;
  onCopy: (text: string) => void;
}) {
  const rows: { name: string; value: string; origin: ColorToken['origin']; occ?: number }[] = [
    ...t.colorTokens.map((c) => ({
      name: c.cssVar,
      value: c.hex,
      origin: c.origin,
      occ: c.occurrences,
    })),
    ...t.spacingNormalized.map((s, i) => ({
      name: `--spacing-${scaleName(i)}`,
      value: s.value,
      origin: s.origin,
      occ: s.occurrences,
    })),
    ...t.radii.map((r, i) => ({
      name: `--radius-${scaleName(i)}`,
      value: r,
      origin: 'extracted' as const,
    })),
  ];
  return (
    <div className="token-table">
      {rows.map((r) => (
        <button
          key={r.name + r.value}
          className={`token-row${copied === `${r.name}: ${r.value};` ? ' is-copied' : ''}`}
          onClick={() => onCopy(`${r.name}: ${r.value};`)}
          title="Copy declaration"
        >
          <span className="token-name">{r.name}</span>
          <span className="token-val">{r.value}</span>
          <OriginBadge origin={r.origin} />
        </button>
      ))}
    </div>
  );
}
