import { useState } from 'react';
import {
  Trophy,
  XCircle,
  ArrowRightLeft,
  TrendingUp,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AgentIcon } from '@/components/agents/identity';
import { TraceButton } from '@/features/trace';
import type { OutcomeEntry, OutcomeDecisionKind } from '@/lib/types';

const DECISION_CONFIG: Record<
  OutcomeDecisionKind,
  { label: string; Icon: typeof Trophy; className: string }
> = {
  win: { label: 'Win', Icon: Trophy, className: 'text-[var(--success)] bg-[var(--success-muted)]' },
  kill: { label: 'Kill', Icon: XCircle, className: 'text-[var(--error)] bg-[var(--error-muted)]' },
  pivot: { label: 'Pivot', Icon: ArrowRightLeft, className: 'text-[var(--info)] bg-[var(--info-muted)]' },
  scale: { label: 'Scale', Icon: TrendingUp, className: 'text-[var(--success)] bg-[var(--success-muted)]' },
  graduate: { label: 'Graduate', Icon: GraduationCap, className: 'text-[var(--accent)] bg-[var(--accent-muted)]' },
};

interface DecisionRowProps {
  outcome: OutcomeEntry;
  /** Resolved Knowledge entries — the evidence. */
  evidenceEntries?: Array<{ id: string; title: string }>;
  onOpenEvidence?: (entryId: string) => void;
  onOpen?: (outcomeId: string) => void;
  className?: string;
}

export function DecisionRow({
  outcome,
  evidenceEntries = [],
  onOpenEvidence,
  onOpen,
  className,
}: DecisionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const config = DECISION_CONFIG[outcome.decision];
  const DecisionIcon = config.Icon;
  const hasMetrics = outcome.metrics && outcome.metrics.length > 0;
  const hasEvidence = evidenceEntries.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors',
        className
      )}
    >
      {/* Header — decision kind + title */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 items-center justify-center rounded-md shrink-0',
            config.className
          )}
        >
          <DecisionIcon className="h-3.5 w-3.5" />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-2xs font-semibold uppercase tracking-wider', config.className.split(' ')[0])}>
              {config.label}
            </span>
            <button
              type="button"
              onClick={() => onOpen?.(outcome.id)}
              className="font-medium text-sm text-[var(--text-primary)] text-left hover:underline"
            >
              {outcome.title}
            </button>
          </div>

          <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
            {outcome.summary}
          </p>

          {/* Meta — attribution */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(outcome.decisionMadeAt).toLocaleDateString()}
            </span>
            {outcome.sourceAgent && (
              <span className="inline-flex items-center gap-1">
                <AgentIcon agent={outcome.sourceAgent} size={10} />
                {outcome.decidedBy === 'agent_recommended' ? 'Agent recommended' : 'Founder'}
              </span>
            )}
            {outcome.sourceVentureId && (
              <span>· {outcome.sourceVentureId}</span>
            )}
            {outcome.sourceFunction && <span>· {outcome.sourceFunction}</span>}
            <TraceButton id={outcome.id} kind="outcome" />
          </div>
        </div>
      </div>

      {/* Metrics — the factual "what happened" */}
      {hasMetrics && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {outcome.metrics!.map((m, i) => (
            <div
              key={i}
              className="rounded-md bg-[var(--surface-2)] p-2.5"
            >
              <p className="text-2xs uppercase tracking-wider text-[var(--text-muted)]">
                {m.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {m.unit === '$' && '$'}
                {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                {m.unit && m.unit !== '$' ? ` ${m.unit}` : ''}
              </p>
              {m.source && (
                <p className="mt-0.5 text-2xs text-[var(--text-muted)]">
                  {m.source}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expand — evidence trail */}
      {(hasEvidence || outcome.measuredResult) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {expanded ? 'Hide trail' : 'Evidence & measured result'}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
          {hasEvidence && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Supporting evidence
              </p>
              <ul className="mt-1.5 space-y-1">
                {evidenceEntries.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEvidence?.(e.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <FileText className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                      <span className="flex-1 truncate">{e.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {outcome.measuredResult && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Measured result
              </p>
              <p className="mt-1 text-xs text-[var(--text-primary)] leading-relaxed">
                {outcome.measuredResult}
              </p>
              {outcome.measuredAt && (
                <p className="mt-1 text-2xs text-[var(--text-muted)]">
                  Measured {new Date(outcome.measuredAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
