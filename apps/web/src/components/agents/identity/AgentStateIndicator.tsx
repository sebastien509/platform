import { cn } from '@/lib/utils/cn';

export type AgentState =
  | 'idle'
  | 'working'
  | 'needs_founder'
  | 'complete'
  | 'blocked'
  | 'paused'
  | 'failed';

interface AgentStateIndicatorProps {
  state: AgentState;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<
  AgentState,
  { label: string; dotClass: string; textClass: string; pulse?: boolean }
> = {
  idle:          { label: 'Idle',          dotClass: 'bg-[var(--text-muted)]', textClass: 'text-[var(--text-muted)]' },
  working:       { label: 'Working',       dotClass: 'bg-[var(--info)]',       textClass: 'text-[var(--info)]',   pulse: true },
  needs_founder: { label: 'Needs founder', dotClass: 'bg-[var(--warning)]',    textClass: 'text-[var(--warning)]' },
  complete:      { label: 'Complete',      dotClass: 'bg-[var(--success)]',    textClass: 'text-[var(--success)]' },
  blocked:       { label: 'Blocked',       dotClass: 'bg-[var(--error)]',      textClass: 'text-[var(--error)]' },
  paused:        { label: 'Paused',        dotClass: 'bg-[var(--warning)]',    textClass: 'text-[var(--warning)]' },
  failed:        { label: 'Failed',        dotClass: 'bg-[var(--error)]',      textClass: 'text-[var(--error)]' },
};

export function AgentStateIndicator({
  state,
  label,
  className,
  size = 'sm',
}: AgentStateIndicatorProps) {
  const config = STATE_CONFIG[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'sm' ? 'text-2xs' : 'text-xs',
        config.textClass,
        className
      )}
      role="status"
      aria-label={`Agent state: ${label || config.label}`}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          config.dotClass,
          config.pulse && 'animate-pulse motion-reduce:animate-none'
        )}
      />
      {label || config.label}
    </span>
  );
}
