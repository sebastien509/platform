import { cn } from '@/lib/utils/cn';

export interface AgentRunStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

interface AgentStepListProps {
  steps: AgentRunStep[];
  variant?: 'compact' | 'full';
  maxVisible?: number;
  className?: string;
}

const GLYPH: Record<AgentRunStep['status'], string> = {
  pending: '○',
  running: '●',
  completed: '✓',
  failed: '✕',
};

const STATUS_CLASS: Record<AgentRunStep['status'], string> = {
  pending: 'text-[var(--text-muted)]',
  running: 'text-[var(--info)]',
  completed: 'text-[var(--success)]',
  failed: 'text-[var(--error)]',
};

function selectVisible(steps: AgentRunStep[], max: number): AgentRunStep[] {
  if (steps.length <= max) return steps;
  const runningIdx = steps.findIndex((s) => s.status === 'running');
  if (runningIdx === -1) return steps.slice(-max);
  const start = Math.max(0, runningIdx - 2);
  return steps.slice(start, start + max);
}

export function AgentStepList({
  steps,
  variant = 'compact',
  maxVisible = 4,
  className,
}: AgentStepListProps) {
  const visible = selectVisible(steps, maxVisible);
  const truncated = steps.length > maxVisible;

  return (
    <ul
      className={cn(
        'agent-step-list',
        variant === 'compact' ? 'is-compact' : 'is-full',
        className
      )}
    >
      {visible.map((step) => (
        <li key={step.id} className="agent-step-list__item">
          <span
            className={cn(
              'agent-step-list__glyph',
              STATUS_CLASS[step.status],
              step.status === 'running' &&
                'animate-pulse motion-reduce:animate-none'
            )}
            aria-hidden="true"
          >
            {GLYPH[step.status]}
          </span>
          <span
            className={cn(
              'agent-step-list__label',
              step.status === 'completed' && 'is-complete'
            )}
          >
            {step.name}
          </span>
        </li>
      ))}
      {truncated && variant === 'compact' && (
        <li className="agent-step-list__more">
          +{steps.length - visible.length} more
        </li>
      )}
    </ul>
  );
}
