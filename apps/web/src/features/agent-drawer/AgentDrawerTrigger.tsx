import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { getIcon as getAgentIcon, getManifest } from './manifests';
import { getIcon as getOpIcon } from '@/features/venture-pages/iconMap';

const MAX_VISIBLE = 6;

/* Only these statuses get a tab. review_ready / done / failed
   are "finished" from the tab's perspective — the run is still
   reachable through the deliverable card's menu, just not
   occupying a permanent slot. */
const TAB_STATUSES = new Set(['working', 'needs_you']);

/**
 * AgentRunStrip — the persistent run bar.
 *
 * What shows:
 *   · Only runs whose status is `working` or `needs_you`
 *   · Only runs belonging to the venture currently in the URL
 *     (`/ventures/:ventureId/...`)
 *
 * What doesn't show:
 *   · The bot button (removed — access is contextual now)
 *   · Runs on other ventures
 *   · Runs on non-venture routes (main shell, Ideas, Library)
 *   · Completed / review-ready / failed runs
 *
 * Click a tab → opens the drawer with that run.
 * Click the active tab again → closes the drawer.
 *
 * The drawer auto-opens when a run emits a `needs_you` block, so
 * the founder is never blocked by a missing entry point.
 */
export function AgentRunStrip({ className }: { className?: string }) {
  const location = useLocation();
  const open = useAgentDrawerStore((s) => s.open);
  const activeRunId = useAgentDrawerStore((s) => s.activeRunId);
  const runs = useAgentDrawerStore((s) => s.runs);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const closeDrawer = useAgentDrawerStore((s) => s.closeDrawer);
  const setActiveRun = useAgentDrawerStore((s) => s.setActiveRun);

  /* Which venture is the URL pointing at? Only the deep route
     counts: `/ventures/:id/...`. `/ventures` (the list) is the
     main shell — no tabs. */
  const routeVentureId = useMemo(() => {
    const m = location.pathname.match(/^\/ventures\/([^/]+)/);
    return m?.[1] ?? null;
  }, [location.pathname]);

  const inFlight = useMemo(() => {
    if (!routeVentureId) return [];
    return Object.values(runs)
      .filter((r) => r.ventureId === routeVentureId)
      /* Kill / validation / failure all set closedAt. The tab
         strip must reflect the SAME rule as the dock — closed
         runs are gone, no matter what their status field says. */
      .filter((r) => !r.closedAt)
      .filter((r) => TAB_STATUSES.has(r.status))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [runs, routeVentureId]);

  if (inFlight.length === 0) return null;

  const visible = inFlight.slice(0, MAX_VISIBLE);
  const overflow = inFlight.length - visible.length;

  const handleRunClick = (runId: string) => {
    if (open && activeRunId === runId) {
      closeDrawer();
      return;
    }
    setActiveRun(runId);
    openDrawer(runId);
  };

  const handleOverflow = () => {
    if (open) closeDrawer();
    else openDrawer(inFlight[0].id);
  };

  return (
    <div
      className={cn('agent-runs-strip', className)}
      role="tablist"
      aria-label="Active agent runs"
    >
      {visible.map((run) => {
        const manifest = getManifest(run.agentId);
        const AgentIcon = getAgentIcon(manifest.icon);
        const opIconName = (run as any).opIcon;
        const OpIcon = opIconName ? getOpIcon(opIconName) : null;
        const Icon = OpIcon ?? AgentIcon;
        const isActive = open && run.id === activeRunId;
        const statusClass = run.status.replace(/_/g, '-');

        return (
          <button
            key={run.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleRunClick(run.id)}
            title={(run as any).opVerb ?? manifest.name}
            className={cn(
              'agent-runs-strip__tab',
              `agent-runs-strip__tab--${statusClass}`,
              isActive && 'is-active'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span
              className={cn(
                'agent-runs-strip__dot',
                `agent-runs-strip__dot--${statusClass}`
              )}
            />
          </button>
        );
      })}
      {overflow > 0 && (
        <button
          type="button"
          className="agent-runs-strip__more"
          onClick={handleOverflow}
          aria-label={`${overflow} more runs`}
        >
          +{overflow}
        </button>
      )}
    </div>
  );
}

/* Backwards-compat alias — existing imports keep working. */
export { AgentRunStrip as AgentDrawerTrigger };
