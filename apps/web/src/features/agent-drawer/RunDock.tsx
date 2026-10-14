import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { getIcon as getOpIcon } from '@/features/venture-pages/iconMap';

/**
 * RunDock — the active-run strip.
 *
 * Sits in the venture header next to health / view controls.
 * Each tab is a run in flight (working / needs_you / review_ready).
 * Closed runs are removed automatically — validation, failure, or
 * manual dismiss all clear the tab.
 *
 * Max 5 visible. Beyond that, the strip scrolls horizontally with
 * a fade-out mask so overflow is discoverable without a scrollbar.
 */
export function RunDock() {
  const activeVentureId = useAgentDrawerStore((s) => s.activeVentureId);
  const activeRunId = useAgentDrawerStore((s) => s.activeRunId);
  const runs = useAgentDrawerStore((s) => s.runs);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);

  const activeRuns = useMemo(() => {
    return Object.values(runs)
      .filter((r) => !activeVentureId || r.ventureId === activeVentureId)
      .filter((r) => !r.closedAt)
      .filter(
        (r) =>
          r.status === 'working' ||
          r.status === 'needs_you' ||
          r.status === 'review_ready'
      )
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }, [runs, activeVentureId]);

  if (activeRuns.length === 0) return null;

  return (
    <div className="run-dock" aria-label="Active runs">
      <div className="run-dock__strip">
        {activeRuns.map((r) => {
          const opIconName = (r as any).opIcon;
          /* getOpIcon can return null — fall back to Sparkles so we
             never render a non-component. */
          const maybeIcon = opIconName ? getOpIcon(opIconName) : null;
          const Icon = (maybeIcon ?? Sparkles) as React.ComponentType<{
            className?: string;
          }>;
          const isActive = r.id === activeRunId;
          const label = (r as any).opVerb ?? r.objective ?? 'Run';
          return (
            <button
              key={r.id}
              type="button"
              className={cn('run-dock__tab', isActive && 'is-active')}
              onClick={() => openDrawer(r.id)}
              title={label}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
              {r.status === 'needs_you' && (
                <span
                  className="run-dock__dot run-dock__dot--attention"
                  aria-hidden
                />
              )}
              {r.status === 'working' && (
                <span
                  className="run-dock__dot run-dock__dot--working"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
