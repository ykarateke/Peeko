import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  type Asset,
  type DesignTokens,
  type ElementInfo,
  type Msg,
  type PageStyles,
} from '../../core/messaging';
import {
  DEFAULT_PREFS,
  getPrefs,
  setPrefs,
  onPrefsChanged,
  type Preferences,
} from '../../core/prefs';
import { Toolbar } from './Toolbar';
import { Tabs, type Tab } from './Tabs';
import { StylesPanel } from './panels/StylesPanel';
import { AssetsPanel } from './panels/AssetsPanel';
import { InspectPanel } from './panels/InspectPanel';
import { DesignPanel } from './panels/DesignPanel';
import { SimulatorPanel } from './panels/SimulatorPanel';
import { CapturePanel } from './panels/CapturePanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { Placeholder } from './panels/Placeholder';

type Load<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error'; restricted: boolean };

type View = null | 'simulator' | 'capture' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('Styles');
  const [view, setView] = useState<View>(null);
  const [inspecting, setInspecting] = useState(false);
  const [rulerActive, setRulerActive] = useState(false);
  const [selected, setSelected] = useState<ElementInfo | null>(null);
  const [styles, setStyles] = useState<Load<PageStyles>>({ state: 'loading' });
  const [assets, setAssets] = useState<Load<Asset[]>>({ state: 'loading' });
  const [design, setDesign] = useState<Load<DesignTokens>>({ state: 'loading' });
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);

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
    query<DesignTokens>('GET_DESIGN_TOKENS', setDesign);
  }, [query]);

  useEffect(() => refresh(), [refresh]);

  // Load prefs and keep them in sync.
  useEffect(() => {
    getPrefs().then(setPrefsState);
    return onPrefsChanged(setPrefsState);
  }, []);

  // Apply theme.
  useEffect(() => {
    const el = document.documentElement;
    if (prefs.theme === 'system') delete el.dataset.theme;
    else el.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  // Content -> panel events.
  useEffect(() => {
    const onMsg = (m: Msg) => {
      if (m.type === 'ELEMENT_CLICKED') {
        setSelected(m.data);
        setInspecting(true);
      } else if (m.type === 'INSPECTOR_STOPPED') {
        setInspecting(false);
      } else if (m.type === 'RULER_STATE_CHANGED') {
        setRulerActive(m.active);
      }
    };
    browser.runtime.onMessage.addListener(onMsg);
    return () => browser.runtime.onMessage.removeListener(onMsg);
  }, []);

  // Sync inspect toggle when opening the Inspect tab (e.g. started via keyboard).
  useEffect(() => {
    if (view !== null || tab !== 'Inspect') return;
    browser.runtime
      .sendMessage({ type: 'GET_INSPECT_STATUS' })
      .then((res: { ok: boolean; data?: { inspecting: boolean } }) => {
        if (res?.ok && res.data) setInspecting(res.data.inspecting);
      })
      .catch(() => {});
  }, [tab, view]);

  function toggleInspect() {
    const next = !inspecting;
    setInspecting(next);
    browser.runtime.sendMessage({ type: 'TOGGLE_INSPECT' }).catch(() => {
      setInspecting((v) => !v);
    });
  }

  function toggleRuler() {
    setRulerActive((v) => !v);
    browser.runtime.sendMessage({ type: 'TOGGLE_PAGE_RULER' }).catch(() => {
      setRulerActive((v) => !v);
    });
  }

  function updatePrefs(patch: Partial<Preferences>) {
    setPrefs(patch).then(setPrefsState);
  }

  function pickTab(t: Tab) {
    setTab(t);
    setView(null);
  }

  const count = styles.state === 'ready' ? styles.data.elementCount : null;
  const assetBadge = assets.state === 'ready' ? assets.data.length : undefined;

  return (
    <div className="app">
      <Toolbar
        inspecting={inspecting}
        rulerActive={rulerActive}
        onToggleInspect={toggleInspect}
        onToggleRuler={toggleRuler}
        onSimulator={() => setView('simulator')}
        onCapture={() => setView('capture')}
        onSettings={() => setView('settings')}
        onRescan={refresh}
      />
      <Tabs active={tab} onChange={pickTab} badges={{ Assets: assetBadge }} />

      <main className="content">
        {view === 'simulator' && <SimulatorPanel />}
        {view === 'capture' && <CapturePanel />}
        {view === 'settings' && <SettingsPanel prefs={prefs} onChange={updatePrefs} />}

        {view === null && tab === 'Styles' && (
          <Loaded load={styles} restrictedTitle="Can't inspect this page">
            {(d) => (
              <StylesPanel colors={d.colors} fonts={d.fonts} defaultColorFormat={prefs.defaultColorFormat} />
            )}
          </Loaded>
        )}
        {view === null && tab === 'Assets' && (
          <Loaded load={assets} restrictedTitle="Can't inspect this page">
            {(d) => <AssetsPanel assets={d} downloadFolder={prefs.downloadFolder} />}
          </Loaded>
        )}
        {view === null && tab === 'Inspect' && (
          <InspectPanel info={selected} inspecting={inspecting} onToggle={toggleInspect} />
        )}
        {view === null && tab === 'Design' && (
          <Loaded load={design} restrictedTitle="Can't inspect this page">
            {(d) => <DesignPanel tokens={d} defaultFormat={prefs.export.defaultFormat} />}
          </Loaded>
        )}
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
