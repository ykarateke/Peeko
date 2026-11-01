// Single source of truth for all inter-context messages. See docs/engineering/API_SPEC.md.

export interface ElementInfo {
  selector: string;
  box: string; // "width × height"
  rect: { x: number; y: number; width: number; height: number }; // viewport px, for screenshots
  dpr: number;
  typography: Record<string, string>;
  color: Record<string, string>;
  layout: Record<string, string>;
  borderEffects: Record<string, string>;
}

export interface FontToken {
  name: string;
  role: string;
  css: string;
  tw: string;
  weights: number[];
}

/** Styles extracted from the active page (Styles panel). */
export interface PageStyles {
  colors: string[]; // hex, most frequent first
  fonts: FontToken[];
  elementCount: number;
}

export interface TypeStyle {
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing?: string;
}

export interface Count {
  value: string;
  count: number;
}

export type TokenOrigin = 'extracted' | 'inferred' | 'normalized';

export interface Token {
  value: string;
  original?: string;
  origin: TokenOrigin;
  occurrences: number;
  confidence?: number; // 0..1
  source?: string;
}

export type ColorGroup =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'surface'
  | 'text'
  | 'border'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'other';

export interface ColorToken extends Token {
  hex: string;
  rgb: string;
  hsl: string;
  cssVar: string;
  group: ColorGroup;
  onLight: number; // WCAG contrast vs #fff
  onDark: number; // WCAG contrast vs #111
  similarTo?: string; // hex of a near-duplicate already in the set
}

export interface TypeStyleToken {
  name: string; // Display, H1..H6, Body, Caption, ...
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing?: string;
  origin: TokenOrigin;
  source?: string;
}

export interface DesignOverviewInfo {
  style: { label: string; confidence: number };
  consistencyScore: number; // 0..100
  characteristics: string[];
  counts: { colors: number; typography: number; components: number; tokens: number };
}

/** Design tokens extracted from the active page (Design panel). */
export interface DesignTokens {
  colors: string[]; // hex, frequency-sorted
  roles: Record<string, string>; // background/text/link/heading/accent/border -> hex
  fontFamilies: string[];
  fontSizes: string[]; // px, ascending (type scale)
  fontWeights: number[];
  lineHeights: string[];
  spacing: string[]; // px, ascending
  radii: string[];
  shadows: string[];
  gradients: string[];
  breakpoints: string[]; // px, ascending
  containers: string[]; // content container max-widths (px), ascending
  durations: string[]; // transition/animation durations
  easings: string[]; // transition/animation timing functions
  animations: string[]; // @keyframes names
  headings: Record<string, TypeStyle>; // 'h1'..'h6' (present ones)
  body: TypeStyle | null;
  bodyColor: string | null; // hex
  components: Record<string, Record<string, string>>; // 'button' | 'link' | 'input' -> prop:value
  baseUnit: string | null; // smallest spacing step
  usage: { colors: Count[]; fontSizes: Count[]; spacing: Count[] }; // value + frequency, for charts
  // Rich model (Design System Inspection). Flat arrays above are derived from these for exporters.
  colorTokens: ColorToken[];
  textStyles: TypeStyleToken[];
  spacingNormalized: Token[];
  overview: DesignOverviewInfo;
  meta: { url: string; title: string; elementCount: number; generatedAt: string };
}

export interface PageMetrics {
  scrollWidth: number;
  scrollHeight: number;
  innerWidth: number;
  innerHeight: number;
  dpr: number;
}

export interface CaptureTile {
  y: number;
  dataUrl: string;
}

export type AssetType = 'image' | 'svg' | 'icon' | 'video' | 'lottie' | 'font';

export interface Asset {
  type: AssetType;
  url: string; // absolute URL, or a data: URL for inline SVG
  name: string;
  meta?: string; // dimensions / format hint
}

export type Msg =
  | { type: 'TOGGLE_INSPECT' }
  | { type: 'STOP_INSPECT' }
  | { type: 'GET_INSPECT_STATUS' }
  | { type: 'GET_PAGE_STYLES' }
  | { type: 'GET_PAGE_ASSETS' }
  | { type: 'GET_DESIGN_TOKENS' }
  | { type: 'GET_PAGE_HTML' }
  | { type: 'ELEMENT_CLICKED'; data: ElementInfo }
  | { type: 'INSPECTOR_STARTED' }
  | { type: 'INSPECTOR_STOPPED' }
  | { type: 'OPEN_OVERLAY'; tabId?: number }
  | { type: 'START_COLOR_PICKER' }
  | { type: 'COLOR_PICKED'; color: string }
  | { type: 'TOGGLE_PAGE_RULER' }
  | { type: 'STOP_PAGE_RULER' }
  | { type: 'RULER_STATE_CHANGED'; active: boolean }
  | { type: 'CAPTURE_SCREENSHOT' }
  | { type: 'CAPTURE_ELEMENT_SCREENSHOT' }
  | { type: 'EXPORT_SECTION' }
  | { type: 'CAPTURE_FULL_PAGE' }
  | { type: 'GET_PAGE_METRICS' }
  | { type: 'PREP_CAPTURE' }
  | { type: 'SCROLL_TO'; y: number }
  | { type: 'END_CAPTURE' }
  | { type: 'DOWNLOAD_IMAGE'; url: string; filename: string }
  | { type: 'DOWNLOAD_FONT'; url: string; filename: string }
  | {
      type: `SIMULATOR_${'ACTIVATE' | 'DEACTIVATE' | 'STATUS' | 'CHANGE_DEVICE' | 'TOGGLE_ORIENTATION' | 'ZOOM'}`;
      payload?: unknown;
    };

/** Raised when a tab cannot host content scripts (chrome://, extension pages, error pages). */
export class RestrictedTabError extends Error {
  constructor() {
    super("This page can't be inspected — try a normal website.");
    this.name = 'RestrictedTabError';
  }
}
