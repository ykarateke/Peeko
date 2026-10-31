import {
  CursorIcon,
  PhoneIcon,
  RulerIcon,
  RefreshIcon,
  BookmarkIcon,
  CollapseIcon,
} from './icons';

interface Props {
  inspecting: boolean;
  onToggleInspect: () => void;
  onRescan: () => void;
}

export function Toolbar({ inspecting, onToggleInspect, onRescan }: Props) {
  return (
    <div className="toolbar">
      <button
        className={`icon-btn${inspecting ? ' is-active' : ''}`}
        title="Inspect (toggle)"
        onClick={onToggleInspect}
      >
        <CursorIcon />
      </button>
      <button className="icon-btn" title="Device simulator">
        <PhoneIcon />
      </button>
      <button className="icon-btn" title="Measure / ruler">
        <RulerIcon />
      </button>
      <button className="icon-btn" title="Re-scan page" onClick={onRescan}>
        <RefreshIcon />
      </button>
      <button className="icon-btn" title="Saved">
        <BookmarkIcon />
      </button>
      <button className="icon-btn" title="Collapse panel">
        <CollapseIcon />
      </button>
    </div>
  );
}
