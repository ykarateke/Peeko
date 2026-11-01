import { useState } from 'react';

/** Copy-to-clipboard with a transient "copied" marker (the last copied text). */
export function useCopy(resetMs = 1100): [string | null, (text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text);
        setTimeout(() => setCopied((c) => (c === text ? null : c)), resetMs);
      },
      () => {},
    );
  };
  return [copied, copy];
}
