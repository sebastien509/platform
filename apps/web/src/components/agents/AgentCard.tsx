import { Agent } from '@/lib/types';
import { AgentIdentity, AgentKey, AgentState } from './identity';
import { AgentStepList, AgentRunStep } from './AgentStepList';
import { cn } from '@/lib/utils/cn';
import { Eye } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  /** Live run steps for this agent. */
  steps?: AgentRunStep[];
  onViewActivity?: () => void;
  onClick?: () => void;
  className?: string;
}

function toAgentKey(role: string): AgentKey {
  const r = role.toLowerCase().replace(/[^a-z]/g, '');
  if (r.includes('research')) return 'research';
  if (r.includes('strateg')) return 'strategy';
  if (r.includes('product')) return 'product';
  if (r.includes('engineer')) return 'engineering';
  if (r.includes('gtm')) return 'gtm';
  if (r.includes('campaign') || r.includes('content') || r.includes('copy'))
    return 'campaign';
  if (r.includes('sales')) return 'sales';
  if (r.includes('growth')) return 'growth';
  if (r.includes('analyst') || r.includes('analysis')) return 'analysis';
  if (r.includes('knowledge')) return 'knowledge';
  if (r.includes('outcome')) return 'outcomes';
  return 'research';
}

function toAgentState(status: string): AgentState {
  const s = status.toLowerCase();
  if (s === 'working') return 'working';
  if (s === 'needs_founder' || s === 'waiting' || s === 'needs_input')
    return 'needs_founder';
  if (s === 'complete' || s === 'completed') return 'complete';
  if (s === 'blocked') return 'blocked';
  if (s === 'paused') return 'paused';
  if (s === 'failed') return 'failed';
  return 'idle';
}

export function AgentCard({
  agent,
  steps,
  onViewActivity,
  onClick,
  className,
}: AgentCardProps) {
  const key = toAgentKey(agent.role);
  const state = toAgentState(agent.status);

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-all hover:shadow-sm',
        className
      )}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <AgentIdentity agent={key} state={state} size="md" />
      </button>

      {agent.currentTask && (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {agent.currentTask}
        </p>
      )}

      {steps && steps.length > 0 && (
        <div className="mt-3">
          <AgentStepList steps={steps} variant="compact" maxVisible={4} />
        </div>
      )}

      {onViewActivity && (
        <button
          type="button"
          onClick={onViewActivity}
          className="mt-3 flex items-center gap-1 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Eye className="h-3 w-3" />
          View Activity
        </button>
      )}
    </div>
  );
}
