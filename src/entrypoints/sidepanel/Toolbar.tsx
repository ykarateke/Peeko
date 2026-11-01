import {
  CursorIcon,
  PhoneIcon,
  RulerIcon,
  RefreshIcon,
  CameraIcon,
  GearIcon,
  PopOutIcon,
  CollapseIcon,
} from './icons';

interface Props {
  inspecting: boolean;
  rulerActive: boolean;
  onToggleInspect: () => void;
  onToggleRuler: () => void;
  onSimulator: () => void;
  onCapture: () => void;
  onSettings: () => void;
  onRescan: () => void;
  onPopOut: () => void;
}

export function Toolbar({
  inspecting,
  rulerActive,
  onToggleInspect,
  onToggleRuler,
  onSimulator,
  onCapture,
  onSettings,
  onRescan,
  onPopOut,
}: Props) {
  return (
    <div className="toolbar">
      <button
        className={`icon-btn${inspecting ? ' is-active' : ''}`}
        title="Inspect (Alt+Shift+I)"
        onClick={onToggleInspect}
      >
        <CursorIcon />
      </button>
      <button className="icon-btn" title="Device simulator" onClick={onSimulator}>
        <PhoneIcon />
      </button>
      <button
        className={`icon-btn${rulerActive ? ' is-active' : ''}`}
        title="Measure / ruler"
        onClick={onToggleRuler}
      >
        <RulerIcon />
      </button>
      <button className="icon-btn" title="Screenshot" onClick={onCapture}>
        <CameraIcon />
      </button>
      <button className="icon-btn" title="Re-scan page" onClick={onRescan}>
        <RefreshIcon />
      </button>
      <button className="icon-btn" title="Settings" onClick={onSettings}>
        <GearIcon />
      </button>
      <button className="icon-btn" title="Pop out (full-width captures)" onClick={onPopOut}>
        <PopOutIcon />
      </button>
      <button className="icon-btn" title="Close panel" onClick={() => window.close()}>
        <CollapseIcon />
      </button>
    </div>
  );
}
