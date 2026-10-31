// Single source of truth for all inter-context messages. See docs/engineering/API_SPEC.md.

export interface ElementInfo {
  typography: Record<string, string>;
  color: Record<string, string>;
  layout: Record<string, string>;
  borderEffects: Record<string, string>;
}

export type Msg =
  | { type: 'TOGGLE_INSPECT' }
  | { type: 'STOP_INSPECT' }
  | { type: 'GET_INSPECT_STATUS' }
  | { type: 'ELEMENT_CLICKED'; data: ElementInfo }
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
