import { type DesignTokens, type Count } from '../../../core/messaging';
import { contrastRatio, wcagLevel } from '../../../core/color';
import { parseEasing, easingPath } from '../../../core/easing';
import { useCopy } from '../useCopy';

const ROLE_LABEL: Record<string, string> = {
  background: 'bg',
  text: 'text',
  accent: 'accent',
  link: 'link',
  heading: 'heading',
  border: 'border',
};

function isLight(hex: string): boolean {
  const n = hex.replace('#', '');
  if (n.length < 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 225;
}

const px = (v: string) => parseFloat(v) || 0;
const max = (a: Count[]) => a.reduce((m, c) => Math.max(m, c.count), 1);

export function DesignOverview({ tokens: t }: { tokens: DesignTokens }) {
  const [copied, copy] = useCopy();
  const family = t.fontFamilies[0] ?? 'inherit';

  return (
    <div className="dov">
      {/* Stat tiles */}
      <div className="stat-tiles">
        <Stat n={t.colors.length} label="colors" />
        <Stat n={t.fontFamilies.length} label="fonts" />
        <Stat n={t.fontSizes.length} label="type sizes" />
        <Stat n={t.spacing.length} label="spacing" />
        <Stat n={t.baseUnit ?? '—'} label="base unit" />
        <Stat n={t.meta.elementCount} label="elements" />
      </div>

      {/* Palette + roles */}
      <Section title="Palette">
        {Object.keys(t.roles).length > 0 && (
          <div className="role-row">
            {Object.entries(t.roles).map(([k, v]) => (
              <button key={k} className="role-chip" title={v} onClick={() => copy(v)}>
                <span
                  className={`role-dot${isLight(v) ? ' is-light' : ''}`}
                  style={{ background: v }}
                />
                {ROLE_LABEL[k] ?? k}
              </button>
            ))}
          </div>
        )}
        <div className="dov-swatches">
          {t.colors.map((c, i) => (
            <button
              key={`${c}-${i}`}
              className={`dov-swatch${isLight(c) ? ' is-light' : ''}${copied === c ? ' is-copied' : ''}`}
              style={{ background: c }}
              title={c}
              onClick={() => copy(c)}
            />
          ))}
        </div>
      </Section>

      {/* Color usage bars */}
      {t.usage.colors.length > 0 && (
        <Section title="Color usage">
          <BarList rows={t.usage.colors.slice(0, 10)} fillByValue />
        </Section>
      )}

      {/* Typography */}
      <Section title="Typography">
        <div className="type-families">{t.fontFamilies.join(' · ') || '—'}</div>
        <div className="type-scale">
          {t.fontSizes.map((s) => (
            <div className="type-row" key={s}>
              <span
                className="type-sample"
                style={{ fontFamily: family, fontSize: Math.min(px(s), 34) }}
              >
                Ag
              </span>
              <span className="type-size">{s}</span>
            </div>
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
        {Object.keys(t.headings).length > 0 && (
          <div className="head-list">
            {Object.entries(t.headings).map(([tag, s]) => (
              <div className="head-row" key={tag}>
                <span className="head-tag">{tag}</span>
                <span className="head-meta">
                  {s.size} · {s.weight} · lh {s.lineHeight}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Spacing */}
      {t.usage.spacing.length > 0 && (
        <Section title="Spacing scale">
          <BarList rows={t.usage.spacing} byPx baseUnit={t.baseUnit} />
        </Section>
      )}

      {/* Radii */}
      {t.radii.length > 0 && (
        <Section title="Radii">
          <div className="chip-previews">
            {t.radii.map((r) => (
              <div className="radii-item" key={r}>
                <span className="radii-box" style={{ borderRadius: r }} />
                <span className="chip-label">{r}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Shadows */}
      {t.shadows.length > 0 && (
        <Section title="Shadows">
          <div className="shadow-previews">
            {t.shadows.map((s, i) => (
              <div className="shadow-box" key={i} style={{ boxShadow: s }} title={s} />
            ))}
          </div>
        </Section>
      )}

      {/* Components */}
      {Object.keys(t.components).length > 0 && (
        <Section title="Components">
          <div className="cmp-previews">
            {t.components.button && (
              <button className="cmp-el" style={styleOf(t.components.button)} tabIndex={-1}>
                Button
              </button>
            )}
            {t.components.input && (
              <input
                className="cmp-el"
                style={styleOf(t.components.input)}
                defaultValue="Input"
                readOnly
                tabIndex={-1}
              />
            )}
            {t.components.link && (
              <a className="cmp-el cmp-link" style={styleOf(t.components.link)}>
                Link
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Contrast */}
      <ContrastBlock t={t} />

      {/* Breakpoints + container */}
      {(t.breakpoints.length > 0 || t.containers.length > 0) && (
        <Section title="Breakpoints">
          <BpRuler breakpoints={t.breakpoints} containers={t.containers} />
        </Section>
      )}

      {/* Motion */}
      {(t.durations.length > 0 || t.easings.length > 0) && (
        <Section title="Motion">
          {t.durations.length > 0 && (
            <div className="chip-previews">
              {t.durations.map((d) => (
                <span className="dur-chip" key={d}>
                  {d}
                </span>
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
        </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dov-sec">
      <div className="section-title dov-h">{title}</div>
      {children}
    </div>
  );
}

function BarList({
  rows,
  fillByValue,
  byPx,
  baseUnit,
}: {
  rows: Count[];
  fillByValue?: boolean;
  byPx?: boolean;
  baseUnit?: string | null;
}) {
  const m = byPx ? Math.max(...rows.map((r) => px(r.value)), 1) : max(rows);
  return (
    <div className="bars">
      {rows.map((r) => {
        const pct = ((byPx ? px(r.value) : r.count) / m) * 100;
        const light = fillByValue && isLight(r.value);
        return (
          <div className="bar-row" key={r.value} title={`${r.value} · used ${r.count}×`}>
            {fillByValue && (
              <span
                className={`bar-swatch${light ? ' is-light' : ''}`}
                style={{ background: r.value }}
              />
            )}
            <div className="bar-track">
              <span
                className={`bar-fill${light ? ' is-light' : ''}${!fillByValue ? ' bar-accent' : ''}${baseUnit === r.value ? ' is-base' : ''}`}
                style={{
                  width: `${Math.max(pct, 3)}%`,
                  background: fillByValue ? r.value : undefined,
                }}
              />
            </div>
            <span className="bar-label">
              {r.value}
              <span className="bar-count">{r.count}×</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ContrastBlock({ t }: { t: DesignTokens }) {
  const bg = t.roles.background;
  const text = t.roles.text ?? t.bodyColor ?? undefined;
  if (!bg || !text) return null;
  const ratio = contrastRatio(text, bg);
  if (ratio === null) return null;
  const level = wcagLevel(ratio);
  return (
    <Section title="Contrast">
      <div className="contrast-sample" style={{ background: bg, color: text }}>
        The quick brown fox
      </div>
      <div className="contrast-meta">
        <span className="contrast-ratio">{ratio.toFixed(2)}:1</span>
        <span className={`contrast-badge lvl-${level.replace(/\s/g, '').toLowerCase()}`}>
          {level}
        </span>
      </div>
    </Section>
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

/** camelCase a kebab css map for React inline styles. */
function styleOf(props: Record<string, string>): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    out[k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as React.CSSProperties;
}
