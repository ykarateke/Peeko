import { type Preferences, type Theme, type ExportFormat } from '../../../core/prefs';
import { type ColorFormat } from '../../../core/color';

const THEMES: Theme[] = ['system', 'light', 'dark'];
const FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl'];
const EXPORTS: ExportFormat[] = ['agent', 'css', 'scss', 'json', 'tailwind', 'markdown'];

interface Props {
  prefs: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}

export function SettingsPanel({ prefs, onChange }: Props) {
  return (
    <>
      <div className="view-head">
        <span className="section-title">SETTINGS</span>
      </div>

      <div className="set-row">
        <label>Theme</label>
        <div className="format-toggle">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`fmt${prefs.theme === t ? ' is-active' : ''}`}
              onClick={() => onChange({ theme: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="set-row">
        <label>Default color format</label>
        <div className="format-toggle">
          {FORMATS.map((f) => (
            <button
              key={f}
              className={`fmt${prefs.defaultColorFormat === f ? ' is-active' : ''}`}
              onClick={() => onChange({ defaultColorFormat: f })}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="set-row">
        <label>Download folder</label>
        <input
          className="set-input"
          value={prefs.downloadFolder}
          onChange={(e) => onChange({ downloadFolder: e.target.value })}
        />
      </div>

      <div className="set-row">
        <label>Default export format</label>
        <select
          className="set-input"
          value={prefs.export.defaultFormat}
          onChange={(e) => onChange({ export: { defaultFormat: e.target.value as ExportFormat } })}
        >
          {EXPORTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <p className="view-note">Stored on this device only (storage.local). Zero sync, zero telemetry.</p>
    </>
  );
}
