import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { type PageStyles } from '../../core/messaging';
import { Toolbar } from './Toolbar';
import { Tabs, type Tab } from './Tabs';
import { StylesPanel } from './panels/StylesPanel';
import { Placeholder } from './panels/Placeholder';
import { ASSET_COUNT } from './data';

type Load =
  | { state: 'loading' }
  | { state: 'ready'; data: PageStyles }
  | { state: 'error'; restricted: boolean };

export function App() {
  const [tab, setTab] = useState<Tab>('Styles');
  const [inspecting, setInspecting] = useState(false);
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  const refresh = useCallback(() => {
    setLoad({ state: 'loading' });
    browser.runtime
      .sendMessage({ type: 'GET_PAGE_STYLES' })
      .then((res: { ok: boolean; data?: PageStyles; error?: string }) => {
        if (res?.ok && res.data) setLoad({ state: 'ready', data: res.data });
        else setLoad({ state: 'error', restricted: res?.error === 'RESTRICTED_TAB' });
      })
      .catch(() => setLoad({ state: 'error', restricted: false }));
  }, []);

  useEffect(() => refresh(), [refresh]);

  function toggleInspect() {
    const next = !inspecting;
    setInspecting(next);
    // Exercises the background relay (inject-and-retry). Full overlay lands later in M2.
    browser.runtime.sendMessage({ type: 'TOGGLE_INSPECT' }).catch(() => {
      setInspecting((v) => !v); // revert on restricted page / no receiver
    });
  }

  const count = load.state === 'ready' ? load.data.elementCount : null;

  return (
    <div className="app">
      <Toolbar inspecting={inspecting} onToggleInspect={toggleInspect} onRescan={refresh} />
      <Tabs active={tab} onChange={setTab} badges={{ Assets: ASSET_COUNT }} />

      <main className="content">
        {tab === 'Styles' &&
          (load.state === 'ready' ? (
            <StylesPanel colors={load.data.colors} fonts={load.data.fonts} />
          ) : load.state === 'loading' ? (
            <Placeholder title="Reading page…" sub="Scanning styles." />
          ) : load.restricted ? (
            <Placeholder title="Can't inspect this page" sub="Open a normal website and rescan." />
          ) : (
            <Placeholder title="Couldn't read the page" sub="Try the rescan button." />
          ))}
        {tab === 'Assets' && <Placeholder title="Assets" />}
        {tab === 'Inspect' && <Placeholder title="Inspect" />}
        {tab === 'Design' && <Placeholder title="Design System" />}
      </main>

      <footer className="footer">
        <span>{count !== null ? `${count} elements` : '—'}</span>
        <span>Ctrl+Shift+C to inspect</span>
      </footer>
    </div>
  );
}
