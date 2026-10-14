import { ArrowRight, Search, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ValidationDecision as DecisionKind } from '@/lib/types';

interface ValidationDecisionProps {
  onDecide: (decision: DecisionKind) => void;
  current?: DecisionKind | null;
  disabled?: boolean;
  className?: string;
}

const DECISIONS: Array<{
  key: DecisionKind;
  label: string;
  description: string;
  Icon: typeof ArrowRight;
  tone: 'default' | 'destructive' | 'neutral';
}> = [
  {
    key: 'continue',
    label: 'Continue to venture',
    description: 'Carry this forward into a venture.',
    Icon: ArrowRight,
    tone: 'default',
  },
  {
    key: 'research_more',
    label: 'Research more',
    description: 'Send back for more evidence first.',
    Icon: Search,
    tone: 'neutral',
  },
  {
    key: 'kill',
    label: 'Kill this idea',
    description: 'Record the decision and stop investing.',
    Icon: XCircle,
    tone: 'destructive',
  },
];

export function ValidationDecision({
  onDecide,
  current,
  disabled,
  className,
}: ValidationDecisionProps) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {DECISIONS.map((d) => {
        const Icon = d.Icon;
        const isSelected = current === d.key;
        return (
          <button
            key={d.key}
            type="button"
            disabled={disabled}
            onClick={() => onDecide(d.key)}
            className={cn(
              'group relative text-left rounded-xl border p-3.5 transition-all',
              'border-[var(--border)] bg-[var(--surface-1)]/60 backdrop-blur-sm',
              'hover:bg-[var(--surface-2)]',
              d.tone === 'destructive' && 'hover:border-[var(--iv-error-a40)]',
              d.tone === 'default' && 'hover:border-[var(--iv-accent-a45)]',
              d.tone === 'neutral' &&
                'hover:border-[var(--border-strong)]',
              isSelected &&
                'border-[var(--accent)] bg-[var(--accent-muted)]/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 mb-2',
                d.tone === 'destructive'
                  ? 'text-[var(--error)]'
                  : d.tone === 'default'
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              )}
            />
            <p
              className={cn(
                'font-semibold text-sm leading-snug',
                d.tone === 'destructive'
                  ? 'text-[var(--error)]'
                  : 'text-[var(--text-primary)]'
              )}
            >
              {d.label}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {d.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
