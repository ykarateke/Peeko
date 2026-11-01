import type { CaptureTile, PageMetrics } from '../../core/messaging';

export type ImgFormat = 'png' | 'jpeg' | 'webp';
export const MIME: Record<ImgFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};
const QUALITY = 0.92;
const MAX_CANVAS = 16384; // conservative vs browser canvas limits

export interface Capture {
  id: string;
  name: string;
  url: string;
  size: number;
  kind: string;
  truncated?: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, fmt: ImgFormat): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('encode failed'))),
      MIME[fmt],
      fmt === 'png' ? undefined : QUALITY,
    ),
  );
}

export async function reencode(dataUrl: string, fmt: ImgFormat): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return toBlob(c, fmt);
}

export async function stitch(
  tiles: CaptureTile[],
  m: PageMetrics,
  fmt: ImgFormat,
): Promise<{ blob: Blob; truncated: boolean }> {
  const dpr = m.dpr || 1;
  const w = Math.round(m.innerWidth * dpr);
  const fullH = Math.round(m.scrollHeight * dpr);
  const h = Math.min(fullH, MAX_CANVAS);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  for (const t of tiles) {
    const y = Math.round(t.y * dpr);
    if (y >= h) continue;
    ctx.drawImage(await loadImage(t.dataUrl), 0, y);
  }
  return { blob: await toBlob(c, fmt), truncated: fullH > h };
}

export async function cropRect(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  dpr: number,
  fmt: ImgFormat,
): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(rect.width * dpr));
  c.height = Math.max(1, Math.round(rect.height * dpr));
  c.getContext('2d')!.drawImage(
    img,
    Math.round(rect.x * dpr),
    Math.round(rect.y * dpr),
    c.width,
    c.height,
    0,
    0,
    c.width,
    c.height,
  );
  return toBlob(c, fmt);
}
