/**
 * @deprecated Use AgentStateIndicator from ./identity instead.
 * Kept for backwards compatibility during Phase 3 migration.
 */
import { AgentStateIndicator, AgentState } from './identity';

interface AgentStatusBadgeProps {
  status: string;
  className?: string;
}

function toState(status: string): AgentState {
  const s = status.toLowerCase();
  if (s === 'working') return 'working';
  if (s === 'waiting' || s === 'needs_founder' || s === 'needs_input')
    return 'needs_founder';
  if (s === 'completed' || s === 'complete') return 'complete';
  if (s === 'blocked') return 'blocked';
  if (s === 'paused') return 'paused';
  if (s === 'failed') return 'failed';
  return 'idle';
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  return <AgentStateIndicator state={toState(status)} className={className} />;
}
