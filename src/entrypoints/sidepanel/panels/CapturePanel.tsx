import { useState } from 'react';
import { browser } from 'wxt/browser';
import { triggerDownload } from '../download';
import { CameraIcon } from '../icons';

export function CapturePanel() {
  const [msg, setMsg] = useState<string | null>(null);

  async function capture() {
    const res = (await browser.runtime
      .sendMessage({ type: 'CAPTURE_SCREENSHOT' })
      .catch(() => null)) as { ok?: boolean; data?: string } | null;
    if (res?.ok && res.data) {
      triggerDownload(res.data, 'peeko-screenshot.png');
      setMsg(null);
    } else {
      setMsg('Could not capture this page.');
    }
  }

  return (
    <>
      <div className="view-head">
        <span className="section-title">SCREENSHOT</span>
      </div>
      <button className="btn" onClick={capture}>
        <CameraIcon size={14} /> Capture visible area
      </button>
      {msg && <p className="view-note">{msg}</p>}
      <p className="view-note">
        Captures the visible part of the page (PNG). To capture a single element, use Inspect →
        select → “Screenshot element”.
      </p>
    </>
  );
}
