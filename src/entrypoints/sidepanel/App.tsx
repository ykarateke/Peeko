import { useState } from 'react';
import { browser } from 'wxt/browser';
import { Toolbar } from './Toolbar';
import { Tabs, type Tab } from './Tabs';
import { StylesPanel } from './panels/StylesPanel';
import { Placeholder } from './panels/Placeholder';
import { ASSET_COUNT, ELEMENT_COUNT } from './data';

export function App() {
  const [tab, setTab] = useState<Tab>('Styles');
  const [inspecting, setInspecting] = useState(false);

  function toggleInspect() {
    const next = !inspecting;
    setInspecting(next);
    // Exercises the background relay (inject-and-retry). Full overlay lands in M2.
    browser.runtime.sendMessage({ type: 'TOGGLE_INSPECT' }).catch(() => {
      setInspecting((v) => !v); // revert on restricted page / no receiver
    });
  }

  return (
    <div className="app">
      <Toolbar inspecting={inspecting} onToggleInspect={toggleInspect} />
      <Tabs active={tab} onChange={setTab} badges={{ Assets: ASSET_COUNT }} />

      <main className="content">
        {tab === 'Styles' && <StylesPanel />}
        {tab === 'Assets' && <Placeholder title="Assets" />}
        {tab === 'Inspect' && <Placeholder title="Inspect" />}
        {tab === 'Design' && <Placeholder title="Design System" />}
      </main>

      <footer className="footer">
        <span>{ELEMENT_COUNT} elements</span>
        <span>Ctrl+Shift+C to inspect</span>
      </footer>
    </div>
  );
}
