import { Loader2, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { AgentIcon } from '@/components/agents/identity';
import type { AgentKey } from '@/components/agents/identity';
import { cn } from '@/lib/utils/cn';

interface AgentMonitorRowProps {
  agent: AgentKey;
  name: string;
  currentTask: string;
  /** Seconds since the run started — pass 0 or omit to hide. */
  elapsedSeconds?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export function AgentMonitorRow({
  agent,
  name,
  currentTask,
  elapsedSeconds = 0,
  expanded = false,
  onToggle,
}: AgentMonitorRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
        'hover:bg-[var(--surface-2)]'
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-2)] shrink-0">
        <AgentIcon agent={agent} size={14} />
      </span>
      <span className="text-sm font-medium text-[var(--text-primary)] truncate shrink-0 max-w-[140px]">
        {name}
      </span>
      <span className="text-2xs text-[var(--text-muted)] shrink-0">
        <Loader2 className="inline h-3 w-3 mr-1 animate-spin motion-reduce:animate-none" />
      </span>
      <span className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] truncate">
        {currentTask}
      </span>
      {elapsedSeconds > 0 && (
        <span className="text-2xs text-[var(--text-muted)] tabular-nums shrink-0 inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatElapsed(elapsedSeconds)}
        </span>
      )}
      <span className="text-[var(--text-muted)] shrink-0">
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}
