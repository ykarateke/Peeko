/** Trigger a browser download for a URL (http, blob, or data). */
export function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

/** Download a text string as a file (blob, no network). */
export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}
