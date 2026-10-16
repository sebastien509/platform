/**
 * containerKind — maps an op's surfaceId to its output container.
 *
 * Every op produces exactly one of six containers. The container
 * tells the founder (on the card) and the drawer (at render time)
 * what shape of deliverable to expect.
 *
 *   Doc    — editorial brief in the side drawer
 *   Deck   — full-screen slide viewer
 *   Code   — mono split-view with copy
 *   HTML   — live preview in an iframe
 *   Sheet  — tabular grid, full-screen modal
 *   Action — connector runs and returns a link
 */
export type ContainerKind = 'Doc' | 'Deck' | 'Code' | 'HTML' | 'Sheet' | 'Action';

export function containerKind(surfaceId?: string): ContainerKind {
  if (!surfaceId) return 'Doc';
  if (surfaceId.endsWith('.deck')) return 'Deck';
  if (surfaceId.endsWith('.sheet')) return 'Sheet';
  if (surfaceId.endsWith('.code')) return 'Code';
  if (surfaceId === 'action.confirm') return 'Action';
  if (
    surfaceId === 'product.landing' ||
    surfaceId === 'engineering.ui-spec' ||
    surfaceId === 'campaigns.email' ||
    surfaceId === 'gtm.landing' ||
    surfaceId === 'campaigns.landing'
  ) {
    return 'HTML';
  }
  return 'Doc';
}

/** One-line description of what the container looks like. */
export function containerHint(kind: ContainerKind): string {
  switch (kind) {
    case 'Doc':    return 'Editorial brief in the side drawer';
    case 'Deck':   return 'Slide deck — opens in a full-screen viewer';
    case 'Code':   return 'Mono split-view with copy';
    case 'HTML':   return 'Live preview — opens in an iframe';
    case 'Sheet':  return 'Tabular grid — opens full-screen';
    case 'Action': return 'Connector runs and returns a link';
  }
}
