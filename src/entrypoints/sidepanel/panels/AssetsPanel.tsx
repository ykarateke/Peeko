import { useState } from 'react';
import { browser } from 'wxt/browser';
import { type Asset, type AssetType } from '../../../core/messaging';
import { useCopy } from '../useCopy';
import { triggerDownload } from '../download';
import { DownloadIcon } from '../icons';

type Filter = 'all' | AssetType;

const ORDER: AssetType[] = ['image', 'svg', 'icon', 'video', 'lottie', 'font'];
const LABEL: Record<AssetType, string> = {
  image: 'Images',
  svg: 'SVG',
  icon: 'Icons',
  video: 'Video',
  lottie: 'Lottie',
  font: 'Fonts',
};
const FOLDER: Record<AssetType, string> = {
  image: 'images',
  svg: 'svg',
  icon: 'icons',
  video: 'video',
  lottie: 'lottie',
  font: 'fonts',
};
const EXT: Partial<Record<AssetType, string>> = { svg: '.svg' };
const THUMBABLE: ReadonlySet<AssetType> = new Set(['image', 'svg', 'icon']);

export function AssetsPanel({
  assets,
  downloadFolder = 'Peeko',
}: {
  assets: Asset[];
  downloadFolder?: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [copied, copyUrl] = useCopy();
  const [zip, setZip] = useState<{ done: number; total: number } | null>(null);
  const [zipMsg, setZipMsg] = useState<string | null>(null);

  const counts = ORDER.map((t) => [t, assets.filter((a) => a.type === t).length] as const).filter(
    ([, n]) => n > 0,
  );
  const shown = filter === 'all' ? assets : assets.filter((a) => a.type === filter);

  function download(a: Asset) {
    if (a.url.startsWith('data:')) {
      triggerDownload(a.url, a.name === 'inline' ? 'inline.svg' : a.name);
      return;
    }
    const folder = a.type === 'font' ? `${downloadFolder}/fonts/` : `${downloadFolder}/`;
    browser.runtime
      .sendMessage({
        type: a.type === 'font' ? 'DOWNLOAD_FONT' : 'DOWNLOAD_IMAGE',
        url: a.url,
        filename: folder + a.name,
      })
      .catch(() => {});
  }

  async function downloadZip() {
    if (zip || shown.length === 0) return;
    setZipMsg(null);
    setZip({ done: 0, total: shown.length });
    const JSZip = (await import('jszip')).default;
    const archive = new JSZip();
    const used = new Set<string>();
    let skipped = 0;

    for (let i = 0; i < shown.length; i++) {
      const a = shown[i];
      if (a) {
        try {
          // Extension pages can fetch cross-origin thanks to <all_urls> host permission.
          const res = await fetch(a.url);
          if (!res.ok) throw new Error(String(res.status));
          archive.file(`${FOLDER[a.type]}/${uniqueName(a, used)}`, await res.blob());
        } catch {
          skipped++;
        }
      }
      setZip({ done: i + 1, total: shown.length });
    }

    const blob = await archive.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'peeko-assets.zip');
    URL.revokeObjectURL(url);
    setZip(null);
    setZipMsg(skipped ? `${shown.length - skipped} saved · ${skipped} skipped (CORS)` : null);
  }

  if (assets.length === 0) {
    return (
      <div className="placeholder">
        <p className="placeholder-title">No assets found</p>
      </div>
    );
  }

  return (
    <>
      <div className="filter-row">
        <button
          className={`filter-chip${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="filter-count">{assets.length}</span>
        </button>
        {counts.map(([t, n]) => (
          <button
            key={t}
            className={`filter-chip${filter === t ? ' is-active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {LABEL[t]} <span className="filter-count">{n}</span>
          </button>
        ))}
      </div>

      <button className="btn zip-btn" onClick={downloadZip} disabled={!!zip}>
        <DownloadIcon size={14} />
        {zip ? `Zipping ${zip.done}/${zip.total}…` : `Download ZIP (${shown.length})`}
      </button>
      {zipMsg && <div className="zip-msg">{zipMsg}</div>}

      <div className="asset-grid">
        {shown.map((a, i) => (
          <div className="asset-card" key={`${a.url}-${i}`}>
            <div className="asset-thumb">
              {THUMBABLE.has(a.type) ? (
                <img src={a.url} alt={a.name} loading="lazy" />
              ) : (
                <span className="asset-glyph">
                  {a.type === 'font' ? 'Aa' : a.type.toUpperCase()}
                </span>
              )}
              <span className="asset-type">{a.type}</span>
            </div>
            <div className="asset-name" title={a.name}>
              {a.name}
            </div>
            <div className="asset-sub">{a.meta ?? ''}</div>
            <div className="asset-actions">
              <button className="mini-btn" title="Download" onClick={() => download(a)}>
                <DownloadIcon size={13} /> Save
              </button>
              <button
                className={`mini-btn${copied === a.url ? ' is-copied' : ''}`}
                title="Copy URL"
                onClick={() => copyUrl(a.url)}
              >
                {copied === a.url ? 'Copied' : 'URL'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function uniqueName(a: Asset, used: Set<string>): string {
  let base = (a.name && a.name !== 'inline' ? a.name : a.type).replace(/[\\/:*?"<>|]+/g, '_');
  if (!/\.[a-z0-9]+$/i.test(base)) base += EXT[a.type] ?? '';
  let name = base;
  let n = 1;
  while (used.has(name)) {
    const dot = base.lastIndexOf('.');
    name = dot > 0 ? `${base.slice(0, dot)}-${n}${base.slice(dot)}` : `${base}-${n}`;
    n++;
  }
  used.add(name);
  return name;
}
