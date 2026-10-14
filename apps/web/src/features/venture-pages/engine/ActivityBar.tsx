import {
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import type { AgentSpec } from './types';

interface ActivityBarProps {
  agent: AgentSpec;
  pageId: string;
}

/**
 * ActivityBar — ambient work indicator. Shows only when there's a
 * live run on this page. Idle pages show nothing — no phantom
 * "Working" bar competing with the ops grid.
 */
export function ActivityBar({ pageId }: Omit<ActivityBarProps, 'agent'>) {
  const runs = useAgentDrawerStore((s) => s.runs);
  const activeVentureId = useAgentDrawerStore((s) => s.activeVentureId);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);

  /* Find a live run for THIS page on THIS venture.
     A run is LIVE only when:
       · it belongs to this page + venture
       · closedAt is null (not validated / failed / abandoned / dismissed)
       · status is one of the three in-flight states

     Anything else — validated, closed, abandoned — is history. The
     bar is only for work actually in flight right now. */
  const activeRun = Object.values(runs).find(
    (r) =>
      r.page === pageId &&
      !r.closedAt &&
      (!activeVentureId || r.ventureId === activeVentureId) &&
      (r.status === 'working' ||
        r.status === 'needs_you' ||
        r.status === 'review_ready')
  );

  if (!activeRun) return null;

  const handleClick = () => openDrawer(activeRun.id);

  const status = activeRun.status;
  const isWorking = status === 'working';
  const isNeedsYou = status === 'needs_you';
  const isReady = status === 'review_ready';

  const Icon =
    status === 'working' ? Loader2 :
    status === 'needs_you' ? AlertCircle :
    status === 'review_ready' ? Sparkles :
    Sparkles;

  const label = isNeedsYou
    ? 'A decision needs you'
    : isReady
    ? 'Work ready for review'
    : activeRun.objective;

  const statusLabel = isWorking
    ? 'Working'
    : isNeedsYou
    ? 'Needs you'
    : isReady
    ? 'Ready'
    : 'Active';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'activity-bar',
        isNeedsYou && 'activity-bar--attention',
        isReady && 'activity-bar--ready'
      )}
      aria-label={isNeedsYou ? 'A decision needs you' : 'View activity'}
    >
      <span className={cn('activity-bar__icon', `is-${status.replace('_', '-')}`)}>
        <Icon className={cn('h-3.5 w-3.5', isWorking && 'animate-spin')} />
      </span>

      <span className="activity-bar__label">{label}</span>

      <span className="activity-bar__status">{statusLabel}</span>

      <span className="activity-bar__cta">
        View activity
        <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}
