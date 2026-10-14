/**
 * opPageMap — derives the page from an op_id.
 *
 * Real op IDs are namespaced: `strategy.define-icp`,
 * `product.generate-prd`, `engineering.scaffold-repo`.
 *
 * The page is the prefix — no map needed for the 90% case.
 * Only redirects (aliases) need explicit overrides here.
 */

/** Aliases — op prefixes that don't match their page id directly. */
const PAGE_ALIASES: Record<string, string> = {
  marketing: 'campaigns',
  content: 'campaigns',
  agents: 'overview',
  overview: 'overview',
};

export function pageFromOp(opId: string | null | undefined): string | null {
  if (!opId) return null;
  const trimmed = opId.trim();
  if (!trimmed) return null;

  /* `strategy.define-icp` → `strategy` */
  const prefix = trimmed.includes('.') ? trimmed.split('.')[0] : null;

  if (prefix) {
    return PAGE_ALIASES[prefix] ?? prefix;
  }

  /* Legacy: single-word op id with no namespace — best-effort lookup. */
  return null;
}

/** Backwards-compat export for anything still importing OP_TO_PAGE. */
export const OP_TO_PAGE: Record<string, string> = {};
