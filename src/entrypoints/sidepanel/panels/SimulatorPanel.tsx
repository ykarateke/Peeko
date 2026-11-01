import { useState } from 'react';
import { browser } from 'wxt/browser';
import { DEVICES, orient, type DeviceProfile } from '../../../core/devices';

export function SimulatorPanel() {
  const [landscape, setLandscape] = useState(false);
  const groups = [...new Set(DEVICES.map((d) => d.group))];

  function open(d: DeviceProfile) {
    const { width, height } = orient(d, landscape);
    browser.runtime.sendMessage({ type: 'SIMULATOR_ACTIVATE', payload: { width, height } }).catch(() => {});
  }

  return (
    <>
      <div className="view-head">
        <span className="section-title">DEVICE SIMULATOR</span>
        <button
          className={`btn btn-sm${landscape ? ' is-on' : ''}`}
          onClick={() => setLandscape((v) => !v)}
        >
          {landscape ? 'Landscape' : 'Portrait'}
        </button>
      </div>

      {groups.map((g) => (
        <div className="sim-group" key={g}>
          <div className="section-title prop-group-title">{g}</div>
          {DEVICES.filter((d) => d.group === g).map((d) => {
            const { width, height } = orient(d, landscape);
            return (
              <button key={d.id} className="sim-row" onClick={() => open(d)}>
                <span className="sim-name">{d.label}</span>
                <span className="sim-dim">
                  {width} × {height}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      <p className="view-note">
        Opens the current page in a device-sized window. DPR and user-agent aren't forced.
      </p>
    </>
  );
}
