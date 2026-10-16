/**
 * PAGE_STATES — the roadmap for every page in the platform.
 *
 *   live        — fully shipped, users can interact
 *   preview     — page renders but items inside are locked
 *   coming_soon — page blocked entirely
 *
 * Used by:
 *   · Sidebar — for the golden "Coming soon" affordance
 *   · Route guards — to substitute <ComingSoon />
 *   · Library / Apps — to gate each item
 */
export type PageState = 'live' | 'preview' | 'coming_soon';

export const PAGE_STATES: Record<string, PageState> = {
  /* ── Venture pages — all live for MVP ── */
  overview:     'live',
  strategy:     'live',
  product:      'live',
  engineering:  'live',
  gtm:          'live',
  campaigns:    'live',
  sales:        'live',
  growth:       'live',
  funding:      'live',
  knowledge:    'live',
  analytics:    'live',
  outcomes:     'live',
  connectors:   'live',

  /* ── Main shell pages ── */
  today:        'live',
  ideas:        'live',
  ventures:     'live',
  settings:     'live',

  /* ── Preview pages — grid renders, items locked ── */
  library:      'preview',
  apps:         'preview',

  /* ── Coming soon — page blocked ── */
  // Add page keys here when they're not ready yet
};

export function getPageState(key: string): PageState {
  return PAGE_STATES[key] ?? 'live';
}

export function isPreviewable(key: string): boolean {
  return getPageState(key) === 'preview';
}

export function isComingSoon(key: string): boolean {
  return getPageState(key) === 'coming_soon';
}
