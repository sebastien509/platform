import { ArrowRight, FileText, Lightbulb, Trophy} from 'lucide-react';
import { AgentIcon } from '@/components/agents/identity';
import { cn } from '@/lib/utils/cn';
import type { TraceItem } from '@/lib/stores/traceStore';

const KIND_ICON: Record<TraceItem['kind'], typeof FileText> = {
  idea: Lightbulb,
  knowledge: FileText,
  requirement: FileText,
  task: FileText,
  campaign: FileText,
  outcome: Trophy,
  decision: FileText,
  agent_finding: FileText,
};

interface TraceItemRowProps {
  item: TraceItem;
  /** Highlighted as the current node. */
  isCurrent?: boolean;
  /** Clicking the row walks the lineage to this item. */
  onWalk?: (item: TraceItem) => void;
  /** Clicking the "open" affordance navigates (if href set). */
  onOpen?: (item: TraceItem) => void;
}

export function TraceItemRow({
  item,
  isCurrent = false,
  onWalk,
  onOpen,
}: TraceItemRowProps) {
  const Icon = KIND_ICON[item.kind] ?? FileText;
  const canOpen = !!item.href && !isCurrent;

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-lg p-2.5 transition-colors',
        isCurrent
          ? 'bg-[var(--accent-muted)]/40 border border-[var(--accent)]/30'
          : 'border border-transparent hover:bg-[var(--surface-2)]'
      )}
    >
      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] shrink-0">
        <Icon className="h-3 w-3" />
      </span>

      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onWalk?.(item)}
          className="block text-left w-full"
        >
          <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            {item.title}
          </p>
          {item.summary && (
            <p className="mt-0.5 text-2xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {item.summary}
            </p>
          )}
        </button>

        <div className="mt-1 flex items-center gap-3 text-2xs text-[var(--text-muted)]">
          {item.agent && (
            <span className="inline-flex items-center gap-1">
              <AgentIcon agent={item.agent} size={10} />
              {item.agent}
            </span>
          )}
          {item.createdAt && (
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          )}
          {item.confidence !== undefined && (
            <span className="tabular-nums">{item.confidence}%</span>
          )}
        </div>
      </div>

      {canOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.(item);
          }}
          aria-label={`Open ${item.title}`}
          className={cn(
            'mt-1 flex h-5 w-5 items-center justify-center rounded-md',
            'text-[var(--text-muted)] opacity-0 group-hover:opacity-100',
            'hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-all'
          )}
        >
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
