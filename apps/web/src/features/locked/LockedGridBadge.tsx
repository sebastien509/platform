import { Sparkles } from 'lucide-react';

/**
 * LockedGridBadge — golden "Coming soon" badge for grid items.
 * Used by Library and Apps & Marketplace while the catalogs are
 * still being built. Every item stays visible + previewable.
 */
export function LockedGridBadge() {
  return (
    <span className="locked-grid-badge">
      <Sparkles className="h-3 w-3" />
      Coming soon
    </span>
  );
}
