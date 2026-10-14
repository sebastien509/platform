import { AgentKey } from '../identity/agentColors';
import { AgentIcon } from '../identity/AgentIcon';
import { FailureReasoning } from './FailureReasoning';
import { FailureRecovery } from './FailureRecovery';
import { Citation } from '../citation';
import { cn } from '@/lib/utils/cn';

interface AgentFailureStateProps {
  agent: AgentKey;
  agentName: string;
  reason: string;
  attempts: number;
  lastAttemptAt: string;
  citations?: Citation[];
  onRetry?: () => void;
  onEscalate?: () => void;
  onIgnore?: () => void;
  onViewTrace?: () => void;
  className?: string;
}

export function AgentFailureState({
  agent,
  agentName,
  reason,
  attempts,
  lastAttemptAt,
  citations,
  onRetry,
  onEscalate,
  onIgnore,
  onViewTrace,
  className,
}: AgentFailureStateProps) {
  return (
    <div className={cn('agent-failure', className)}>
      <div className="agent-failure__header">
        <span className="agent-failure__icon-wrap">
          <AgentIcon agent={agent} size={16} />
        </span>
        <span className="agent-failure__agent-name">{agentName}</span>
        <span className="agent-failure__status">Failed</span>
      </div>
      <p className="agent-failure__lead">This agent needs your help.</p>
      <FailureReasoning
        reason={reason}
        attempts={attempts}
        lastAttemptAt={lastAttemptAt}
        citations={citations}
      />
      <FailureRecovery
        onRetry={onRetry}
        onEscalate={onEscalate}
        onIgnore={onIgnore}
        onViewTrace={onViewTrace}
      />
    </div>
  );
}
