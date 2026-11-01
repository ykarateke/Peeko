import { useState, type Dispatch, type SetStateAction } from 'react';
import { browser } from 'wxt/browser';
import {
  type CaptureTile,
  type ElementInfo,
  type Msg,
  type PageMetrics,
} from '../../../core/messaging';
import { reencode, stitch, cropRect, type Capture, type ImgFormat } from '../capture';
import { buildSnapshot, type SnapshotSummary } from '../snapshot';
import { triggerDownload } from '../download';
import { CameraIcon, PhoneIcon, CursorIcon, DownloadIcon } from '../icons';

const FORMATS: ImgFormat[] = ['png', 'jpeg', 'webp'];
type Sub = 'screenshots' | 'source' | 'history';

let seq = 0;
const stamp = () =>
  new Date().toISOString().replace(/[:T]/g, '-').replace(/[.:Z]/g, '').slice(0, 15);

interface MsgResult {
  ok?: boolean;
  data?: unknown;
  error?: string;
}
function send(m: Msg): Promise<MsgResult> {
  return browser.runtime.sendMessage(m).catch(() => ({ ok: false })) as Promise<MsgResult>;
}

/** Enter inspect, resolve with the first clicked element's info, then stop. */
function pickElement(): Promise<ElementInfo | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (info: ElementInfo | null) => {
      if (done) return;
      done = true;
      browser.runtime.onMessage.removeListener(onMsg);
      browser.runtime.sendMessage({ type: 'STOP_INSPECT' }).catch(() => {});
      resolve(info);
    };
    const onMsg = (m: Msg) => {
      if (m.type === 'ELEMENT_CLICKED') finish(m.data);
      else if (m.type === 'INSPECTOR_STOPPED') finish(null);
    };
    browser.runtime.onMessage.addListener(onMsg);
    browser.runtime.sendMessage({ type: 'TOGGLE_INSPECT' }).catch(() => finish(null));
  });
}

export function ExportPanel({
  captures,
  setCaptures,
}: {
  captures: Capture[];
  setCaptures: Dispatch<SetStateAction<Capture[]>>;
}) {
  const [sub, setSub] = useState<Sub>('screenshots');
  const [fmt, setFmt] = useState<ImgFormat>('png');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [srcSummary, setSrcSummary] = useState<SnapshotSummary | null>(null);

  function record(blob: Blob, name: string, kind: string, truncated?: boolean) {
    const url = URL.createObjectURL(blob);
    setCaptures((prev) => [
      { id: `c${++seq}`, name, url, size: blob.size, kind, truncated },
      ...prev,
    ]);
  }
  function add(blob: Blob, kind: string, truncated?: boolean) {
    record(blob, `peeko-${kind}-${stamp()}.${fmt}`, kind, truncated);
    setSub('history');
  }

  async function run(label: string, fn: () => Promise<void>) {
    if (busy) return;
    setErr(null);
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Capture failed.');
    } finally {
      setBusy(null);
    }
  }

  const restricted = (r: MsgResult) =>
    r.error === 'RESTRICTED_TAB'
      ? "This page can't be captured — open a normal site."
      : 'Capture failed.';

  function captureViewport() {
    return run('Capturing viewport…', async () => {
      const r = await send({ type: 'CAPTURE_SCREENSHOT' });
      if (!r.ok || !r.data) throw new Error(restricted(r));
      add(await reencode(r.data as string, fmt), 'viewport');
    });
  }
  function captureFull() {
    return run('Capturing full page…', async () => {
      const r = await send({ type: 'CAPTURE_FULL_PAGE' });
      if (!r.ok || !r.data) throw new Error(restricted(r));
      const { metrics, tiles } = r.data as { metrics: PageMetrics; tiles: CaptureTile[] };
      const { blob, truncated } = await stitch(tiles, metrics, fmt);
      add(blob, 'fullpage', truncated);
    });
  }
  function captureElement() {
    return run('Pick an element on the page…', async () => {
      const info = await pickElement();
      if (!info) throw new Error('No element selected.');
      const r = await send({ type: 'CAPTURE_SCREENSHOT' });
      if (!r.ok || !r.data) throw new Error(restricted(r));
      add(await cropRect(r.data as string, info.rect, info.dpr, fmt), 'element');
    });
  }

  function saveSnapshot() {
    return run('Building snapshot…', async () => {
      setSrcSummary(null);
      const r = await send({ type: 'GET_PAGE_HTML' });
      if (!r.ok || !r.data) throw new Error(restricted(r));
      const { html, baseUrl } = r.data as { html: string; baseUrl: string };
      const { blob, summary } = await buildSnapshot(html, baseUrl, (label) => setBusy(label));
      record(blob, `peeko-snapshot-${stamp()}.html`, 'snapshot');
      setSrcSummary(summary);
    });
  }

  function remove(c: Capture) {
    URL.revokeObjectURL(c.url);
    setCaptures((prev) => prev.filter((x) => x.id !== c.id));
  }

  return (
    <>
      <div className="filter-row">
        {(['screenshots', 'source', 'history'] as Sub[]).map((s) => (
          <button
            key={s}
            className={`filter-chip${sub === s ? ' is-active' : ''}`}
            onClick={() => setSub(s)}
          >
            {s === 'screenshots' ? 'Screenshots' : s === 'source' ? 'Source' : 'History'}
            {s === 'history' && captures.length > 0 && (
              <span className="filter-count">{captures.length}</span>
            )}
          </button>
        ))}
      </div>

      {sub === 'screenshots' && (
        <>
          <div className="format-toggle">
            {FORMATS.map((f) => (
              <button
                key={f}
                className={`fmt${fmt === f ? ' is-active' : ''}`}
                onClick={() => setFmt(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="export-actions">
            <button className="btn" onClick={captureFull} disabled={!!busy}>
              <CameraIcon size={14} /> Full page
            </button>
            <button className="btn" onClick={captureViewport} disabled={!!busy}>
              <PhoneIcon size={14} /> Viewport
            </button>
            <button className="btn" onClick={captureElement} disabled={!!busy}>
              <CursorIcon size={14} /> Pick element
            </button>
          </div>
          {busy && <p className="view-note">{busy}</p>}
          {err && <p className="view-note export-err">{err}</p>}
          <p className="view-note">
            Tip: use <strong>Pop out</strong> (toolbar) so the docked panel doesn't narrow the page
            — captures then come out full-width. Full page scrolls and stitches the whole page
            (fixed/sticky hidden during capture; very long pages are capped). Captures stay in
            History for this session.
          </p>
        </>
      )}

      {sub === 'source' && (
        <>
          <div className="export-actions">
            <button className="btn" onClick={saveSnapshot} disabled={!!busy}>
              <DownloadIcon size={14} /> Save snapshot (.html)
            </button>
          </div>
          {busy && <p className="view-note">{busy}</p>}
          {err && <p className="view-note export-err">{err}</p>}
          {srcSummary && (
            <div className="src-summary">
              <span>{srcSummary.inlined} inlined</span>
              <span>{Math.round(srcSummary.bytes / 1024)} KB</span>
              {srcSummary.skipped > 0 && (
                <span className="src-failed">{srcSummary.skipped} skipped</span>
              )}
            </div>
          )}
          <p className="view-note">
            A faithful self-contained <code>.html</code>: CSS, images and fonts are inlined and
            scripts are removed, so it opens offline looking like the page. Shadow DOM, canvas,
            cross-origin-blocked and very large assets may not inline (an optional{' '}
            <code>&lt;base&gt;</code> lets the rest load live).
          </p>
        </>
      )}

      {sub === 'history' &&
        (captures.length === 0 ? (
          <div className="placeholder">
            <p className="placeholder-title">No captures yet</p>
            <p className="placeholder-sub">Take a screenshot from the Screenshots tab.</p>
          </div>
        ) : (
          <div className="export-gallery">
            {captures.map((c) => (
              <div className="export-item" key={c.id}>
                <div className="export-thumb">
                  {c.kind === 'snapshot' ? (
                    <span className="export-file">HTML</span>
                  ) : (
                    <img src={c.url} alt={c.name} loading="lazy" />
                  )}
                </div>
                <div className="export-meta">
                  <span className="export-name" title={c.name}>
                    {c.kind}
                    {c.truncated && ' · truncated'}
                  </span>
                  <span className="export-size">{Math.round(c.size / 1024)} KB</span>
                </div>
                <div className="export-item-actions">
                  <button className="mini-btn" onClick={() => triggerDownload(c.url, c.name)}>
                    Save
                  </button>
                  <button className="mini-btn" onClick={() => remove(c)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </>
  );
}
