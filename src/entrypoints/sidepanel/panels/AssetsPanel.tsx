import { useState } from 'react';
import { browser } from 'wxt/browser';
import { type Asset, type AssetType } from '../../../core/messaging';
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
const THUMBABLE: ReadonlySet<AssetType> = new Set(['image', 'svg', 'icon']);

export function AssetsPanel({ assets }: { assets: Asset[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const counts = ORDER.map((t) => [t, assets.filter((a) => a.type === t).length] as const).filter(
    ([, n]) => n > 0,
  );
  const shown = filter === 'all' ? assets : assets.filter((a) => a.type === filter);

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(url);
        setTimeout(() => setCopied((c) => (c === url ? null : c)), 1100);
      },
      () => {},
    );
  }

  function download(a: Asset) {
    if (a.url.startsWith('data:')) {
      const el = document.createElement('a');
      el.href = a.url;
      el.download = a.name;
      el.click();
      return;
    }
    const folder = a.type === 'font' ? 'Peeko/fonts/' : 'Peeko/';
    browser.runtime
      .sendMessage({
        type: a.type === 'font' ? 'DOWNLOAD_FONT' : 'DOWNLOAD_IMAGE',
        url: a.url,
        filename: folder + a.name,
      })
      .catch(() => {});
  }

  if (assets.length === 0) {
    return <div className="placeholder"><p className="placeholder-title">No assets found</p></div>;
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

      <div className="asset-grid">
        {shown.map((a, i) => (
          <div className="asset-card" key={`${a.url}-${i}`}>
            <div className="asset-thumb">
              {THUMBABLE.has(a.type) ? (
                <img src={a.url} alt={a.name} loading="lazy" />
              ) : (
                <span className="asset-glyph">{a.type === 'font' ? 'Aa' : a.type.toUpperCase()}</span>
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
