import { describe, it, expect } from 'vitest';
import type { DesignTokens } from './messaging';
import {
  exportCss,
  exportScss,
  exportJson,
  exportTailwind,
  exportMarkdown,
  exportAgentBrief,
} from './exporters';

const t: DesignTokens = {
  colors: ['#4b74ff', '#111111'],
  roles: { background: '#ffffff', text: '#111111', accent: '#4b74ff' },
  fontFamilies: ['Inter', 'Mona Sans'],
  fontSizes: ['14px', '16px', '24px'],
  fontWeights: [400, 700],
  lineHeights: ['1.5'],
  spacing: ['4px', '8px', '16px'],
  radii: ['8px'],
  shadows: ['rgba(0, 0, 0, 0.1) 0px 1px 2px 0px'],
  gradients: [],
  breakpoints: ['640px', '1024px'],
  meta: { url: 'https://x.test', title: 'X', elementCount: 10, generatedAt: '2026-01-01T00:00:00Z' },
};

describe('exportCss', () => {
  const css = exportCss(t);
  it('wraps in :root', () => expect(css).toContain(':root {'));
  it('numbers colors and keeps roles', () => {
    expect(css).toContain('--color-1: #4b74ff;');
    expect(css).toContain('--color-background: #ffffff;');
  });
  it('quotes multi-word families', () => expect(css).toContain("--font-2: 'Mona Sans', sans-serif;"));
});

describe('exportScss', () => {
  it('uses $ variables', () => expect(exportScss(t)).toContain('$color-1: #4b74ff;'));
});

describe('exportJson', () => {
  const parsed = JSON.parse(exportJson(t)) as {
    color: Record<string, { $value: string; $type: string }>;
    spacing: Record<string, { $type: string }>;
    fontFamily: Record<string, { $value: string[] }>;
  };
  it('is valid DTCG-style JSON', () => {
    expect(parsed.color['1']?.$value).toBe('#4b74ff');
    expect(parsed.color['1']?.$type).toBe('color');
    expect(parsed.color['background']?.$value).toBe('#ffffff');
    expect(parsed.spacing['1']?.$type).toBe('dimension');
    expect(parsed.fontFamily['1']?.$value).toEqual(['Inter']);
  });
});

describe('exportTailwind', () => {
  const tw = exportTailwind(t);
  it('opens an @theme block with namespaced vars', () => {
    expect(tw).toContain('@theme {');
    expect(tw).toContain('--color-1: #4b74ff;');
    expect(tw).toContain('--font-sans: Inter, sans-serif;');
  });
});

describe('exportMarkdown', () => {
  it('has headings', () => {
    const md = exportMarkdown(t);
    expect(md).toContain('# Design System');
    expect(md).toContain('## Colors');
  });
});

describe('exportAgentBrief', () => {
  const brief = exportAgentBrief(t);
  it('includes analysis sections and an embedded CSS block', () => {
    expect(brief).toContain('# Design System Analysis');
    expect(brief).toContain('## Semantic color roles');
    expect(brief).toContain('## Replication notes');
    expect(brief).toContain('```css');
    expect(brief).toContain('--color-1: #4b74ff;');
  });
});
