import type { ElementInfo } from './messaging';

type Groups = Pick<ElementInfo, 'typography' | 'color' | 'layout' | 'borderEffects'>;

const GROUPS = {
  typography: [
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'text-align',
    'text-transform',
  ],
  color: ['color', 'background-color', 'fill', 'stroke'],
  layout: [
    'display',
    'position',
    'width',
    'height',
    'padding',
    'margin',
    'box-sizing',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'grid-template-columns',
  ],
  borderEffects: [
    'border',
    'border-radius',
    'box-shadow',
    'opacity',
    'outline',
    'filter',
    'backdrop-filter',
  ],
} as const;

const NOISE = new Set(['', 'none', 'normal', 'auto', 'rgba(0, 0, 0, 0)', 'transparent', '0px']);

/** Pure: group a computed-style getter into the four display groups, dropping noise/defaults. */
export function groupComputed(get: (prop: string) => string): Groups {
  const pick = (props: readonly string[]): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const p of props) {
      const v = (get(p) ?? '').trim();
      if (!NOISE.has(v)) out[p] = v;
    }
    return out;
  };
  return {
    typography: pick(GROUPS.typography),
    color: pick(GROUPS.color),
    layout: pick(GROUPS.layout),
    borderEffects: pick(GROUPS.borderEffects),
  };
}

/** Read an element's grouped computed styles + a short selector and box size. */
export function readElementInfo(el: Element): ElementInfo {
  const cs = getComputedStyle(el);
  const get = (p: string): string => {
    // `border` shorthand is empty in computed styles — synthesize from the top edge.
    if (p === 'border') {
      const w = cs.getPropertyValue('border-top-width');
      const style = cs.getPropertyValue('border-top-style');
      const color = cs.getPropertyValue('border-top-color');
      return style === 'none' || w === '0px' ? '' : `${w} ${style} ${color}`;
    }
    return cs.getPropertyValue(p);
  };
  const rect = el.getBoundingClientRect();
  return {
    ...groupComputed(get),
    selector: selectorFor(el),
    box: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    dpr: window.devicePixelRatio || 1,
  };
}

function selectorFor(el: Element): string {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  const cls = (el.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean)[0];
  if (cls) s += `.${cls}`;
  return s;
}
