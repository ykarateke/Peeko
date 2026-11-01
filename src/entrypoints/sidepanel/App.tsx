import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { type Asset, type ElementInfo, type Msg, type PageStyles } from '../../core/messaging';
import { Toolbar } from './Toolbar';
import { Tabs, type Tab } from './Tabs';
import { StylesPanel } from './panels/StylesPanel';
import { AssetsPanel } from './panels/AssetsPanel';
import { InspectPanel } from './panels/InspectPanel';
import { Placeholder } from './panels/Placeholder';

type Load<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error'; restricted: boolean };

export function App() {
  const [tab, setTab] = useState<Tab>('Styles');
  const [inspecting, setInspecting] = useState(false);
  const [selected, setSelected] = useState<ElementInfo | null>(null);
  const [styles, setStyles] = useState<Load<PageStyles>>({ state: 'loading' });
  const [assets, setAssets] = useState<Load<Asset[]>>({ state: 'loading' });

  const query = useCallback(function <T>(type: Msg['type'], set: (l: Load<T>) => void) {
    set({ state: 'loading' });
    browser.runtime
      .sendMessage({ type })
      .then((res: { ok: boolean; data?: T; error?: string }) => {
        if (res?.ok && res.data !== undefined) set({ state: 'ready', data: res.data });
        else set({ state: 'error', restricted: res?.error === 'RESTRICTED_TAB' });
      })
      .catch(() => set({ state: 'error', restricted: false }));
  }, []);

  const refresh = useCallback(() => {
    query<PageStyles>('GET_PAGE_STYLES', setStyles);
    query<Asset[]>('GET_PAGE_ASSETS', setAssets);
  }, [query]);

  useEffect(() => refresh(), [refresh]);

  // Content -> panel: selected element + inspect-stopped (ESC / toggle).
  useEffect(() => {
    const onMsg = (m: Msg) => {
      if (m.type === 'ELEMENT_CLICKED') {
        setSelected(m.data);
        setInspecting(true);
      } else if (m.type === 'INSPECTOR_STOPPED') {
        setInspecting(false);
      }
    };
    browser.runtime.onMessage.addListener(onMsg);
    return () => browser.runtime.onMessage.removeListener(onMsg);
  }, []);

  // Sync the toggle when the Inspect tab opens (e.g. started via keyboard).
  useEffect(() => {
    if (tab !== 'Inspect') return;
    browser.runtime
      .sendMessage({ type: 'GET_INSPECT_STATUS' })
      .then((res: { ok: boolean; data?: { inspecting: boolean } }) => {
        if (res?.ok && res.data) setInspecting(res.data.inspecting);
      })
      .catch(() => {});
  }, [tab]);

  function toggleInspect() {
    const next = !inspecting;
    setInspecting(next);
    // Exercises the background relay (inject-and-retry). Full overlay lands later in M2.
    browser.runtime.sendMessage({ type: 'TOGGLE_INSPECT' }).catch(() => {
      setInspecting((v) => !v); // revert on restricted page / no receiver
    });
  }

  const count = styles.state === 'ready' ? styles.data.elementCount : null;
  const assetBadge = assets.state === 'ready' ? assets.data.length : undefined;

  return (
    <div className="app">
      <Toolbar inspecting={inspecting} onToggleInspect={toggleInspect} onRescan={refresh} />
      <Tabs active={tab} onChange={setTab} badges={{ Assets: assetBadge }} />

      <main className="content">
        {tab === 'Styles' && (
          <Loaded load={styles} restrictedTitle="Can't inspect this page">
            {(d) => <StylesPanel colors={d.colors} fonts={d.fonts} />}
          </Loaded>
        )}
        {tab === 'Assets' && (
          <Loaded load={assets} restrictedTitle="Can't inspect this page">
            {(d) => <AssetsPanel assets={d} />}
          </Loaded>
        )}
        {tab === 'Inspect' && (
          <InspectPanel info={selected} inspecting={inspecting} onToggle={toggleInspect} />
        )}
        {tab === 'Design' && <Placeholder title="Design System" />}
      </main>

      <footer className="footer">
        <span>{count !== null ? `${count} elements` : '—'}</span>
        <span>Alt+Shift+I to inspect</span>
      </footer>
    </div>
  );
}

function Loaded<T>({
  load,
  restrictedTitle,
  children,
}: {
  load: Load<T>;
  restrictedTitle: string;
  children: (data: T) => React.ReactNode;
}) {
  if (load.state === 'ready') return <>{children(load.data)}</>;
  if (load.state === 'loading') return <Placeholder title="Reading page…" sub="Scanning." />;
  return load.restricted ? (
    <Placeholder title={restrictedTitle} sub="Open a normal website and rescan." />
  ) : (
    <Placeholder title="Couldn't read the page" sub="Try the rescan button." />
  );
}
