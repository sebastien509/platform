import { RefreshCw } from 'lucide-react';

/**
 * DevResetDeliverables — clears local state so a venture can be
 * re-walked from scratch. Dev-only affordance.
 */
export function DevResetDeliverables() {
  const resetDeliverables = () => {
    /* Deliverables */
    localStorage.removeItem('iv-deliverables-store');
    /* Agent runs */
    localStorage.removeItem('iv-agent-drawer-store');
    /* Share links + comments */
    localStorage.removeItem('iv-share-store');
    /* Reload */
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={resetDeliverables}
      className="dev-reset-btn"
      title="Clear all local deliverables, runs, and share links. Reloads."
    >
      <RefreshCw className="h-3 w-3" />
      Reset deliverables (dev)
    </button>
  );
}
