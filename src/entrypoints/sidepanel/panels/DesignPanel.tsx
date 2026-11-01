import { useMemo, useState } from 'react';
import { type DesignTokens } from '../../../core/messaging';
import {
  exportCss,
  exportScss,
  exportJson,
  exportTailwind,
  exportMarkdown,
  exportAgentBrief,
} from '../../../core/exporters';
import { useCopy } from '../useCopy';
import { downloadText } from '../download';
import { DownloadIcon } from '../icons';
import { DesignOverview } from './DesignOverview';

interface Format {
  key: string;
  label: string;
  file: string;
  mime: string;
  run: (t: DesignTokens) => string;
}

const FORMATS: Format[] = [
  {
    key: 'agent',
    label: 'AI Brief',
    file: 'peeko-agent-brief.md',
    mime: 'text/markdown',
    run: exportAgentBrief,
  },
  { key: 'css', label: 'CSS', file: 'peeko-tokens.css', mime: 'text/css', run: exportCss },
  { key: 'scss', label: 'SCSS', file: 'peeko-tokens.scss', mime: 'text/x-scss', run: exportScss },
  {
    key: 'json',
    label: 'JSON',
    file: 'peeko-tokens.json',
    mime: 'application/json',
    run: exportJson,
  },
  { key: 'tailwind', label: 'Tailwind', file: 'theme.css', mime: 'text/css', run: exportTailwind },
  {
    key: 'markdown',
    label: 'Markdown',
    file: 'design.md',
    mime: 'text/markdown',
    run: exportMarkdown,
  },
];

export function DesignPanel({
  tokens,
  defaultFormat = 'agent',
}: {
  tokens: DesignTokens;
  defaultFormat?: string;
}) {
  const [key, setKey] = useState<string>(defaultFormat);
  const [copied, copy] = useCopy();
  const current = FORMATS.find((f) => f.key === key) ?? FORMATS[0]!;
  const output = useMemo(() => current.run(tokens), [current, tokens]);

  return (
    <>
      <DesignOverview tokens={tokens} />

      <div className="export-head">
        <span className="section-title">EXPORT</span>
      </div>

      <div className="format-toggle design-formats">
        {FORMATS.map((f) => (
          <button
            key={f.key}
            className={`fmt${key === f.key ? ' is-active' : ''}`}
            onClick={() => setKey(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={() => copy(output)}>
          {copied === output ? 'Copied' : 'Copy'}
        </button>
        <button className="btn" onClick={() => downloadText(current.file, output, current.mime)}>
          <DownloadIcon size={14} /> Download
        </button>
      </div>

      <pre className="code-preview">
        <code>{output}</code>
      </pre>
    </>
  );
}
