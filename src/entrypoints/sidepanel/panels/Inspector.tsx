import { type TokenOrigin } from '../../../core/messaging';

export interface InspectorRow {
  label: string;
  value: string;
  copyable?: boolean;
}

interface Props {
  title: string;
  swatch?: string;
  origin?: TokenOrigin;
  confidence?: number;
  rows: InspectorRow[];
  note?: string;
  copied: string | null;
  onCopy: (text: string) => void;
  onClose: () => void;
}

export function Inspector({
  title,
  swatch,
  origin,
  confidence,
  rows,
  note,
  copied,
  onCopy,
  onClose,
}: Props) {
  return (
    <div className="inspector" role="dialog" aria-label={`${title} details`}>
      <div className="inspector-head">
        <div className="inspector-title">
          {swatch && <span className="inspector-swatch" style={{ background: swatch }} />}
          <span>{title}</span>
        </div>
        <button className="icon-btn" title="Close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {origin && (
        <div className="inspector-badges">
          <OriginBadge origin={origin} />
          {confidence !== undefined && origin !== 'extracted' && (
            <span className="conf">{Math.round(confidence * 100)}% confidence</span>
          )}
        </div>
      )}

      <div className="inspector-rows">
        {rows.map((r) => (
          <button
            key={r.label}
            className={`insp-row${r.copyable ? ' is-copyable' : ''}${copied === r.value ? ' is-copied' : ''}`}
            onClick={() => r.copyable && onCopy(r.value)}
            disabled={!r.copyable}
          >
            <span className="insp-k">{r.label}</span>
            <span className="insp-v">{copied === r.value ? 'Copied' : r.value}</span>
          </button>
        ))}
      </div>

      {note && <p className="view-note">{note}</p>}
    </div>
  );
}

export function OriginBadge({ origin }: { origin: TokenOrigin }) {
  return <span className={`origin-badge origin-${origin}`}>{origin}</span>;
}
