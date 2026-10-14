import type { RenderType } from './page-actions';

export interface RenderTypeMeta {
  label: string;
  short: string;
}

/**
 * Human labels for each render type. Used by type badges on chips,
 * cards, and sources rows so the founder always sees what kind of
 * artifact they're about to open.
 */
export const RENDER_TYPE_META: Record<RenderType, RenderTypeMeta> = {
  markdown: { label: 'Document', short: 'DOC' },
  report:   { label: 'Report',   short: 'REPORT' },
  html:     { label: 'HTML page', short: 'HTML' },
  deck:     { label: 'Deck',     short: 'DECK' },
  code:     { label: 'Code',     short: 'CODE' },
  sheet:    { label: 'Sheet',    short: 'SHEET' },
  repo:     { label: 'Repo',     short: 'REPO' },
  operational: { label: 'Action', short: 'ACTION' },
};

export function getRenderTypeMeta(
  rt: RenderType | undefined
): RenderTypeMeta {
  if (!rt) return { label: 'Document', short: 'DOC' };
  return RENDER_TYPE_META[rt];
}
