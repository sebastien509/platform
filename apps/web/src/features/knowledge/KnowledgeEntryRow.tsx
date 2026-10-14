import { FileText, Microscope, MessageSquare, Lightbulb, CheckSquare, Sparkles, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { ConnectedWeb } from './ConnectedWeb';
import { AgentIcon } from '@/components/agents/identity';
import { TraceButton } from '@/features/trace';
import type { KnowledgeEntry, KnowledgeEntryType } from '@/lib/types';

const TYPE_ICON: Record<KnowledgeEntryType, typeof FileText> = {
  research_report: FileText,
  market_analysis: Microscope,
  competitive_analysis: Microscope,
  interview_transcript: MessageSquare,
  customer_insight: Lightbulb,
  founder_selection: CheckSquare,
  synthesized_answer: Sparkles,
  research_note: FileText,
  document: Upload,
};

const TYPE_LABEL: Record<KnowledgeEntryType, string> = {
  research_report: 'Report',
  market_analysis: 'Market',
  competitive_analysis: 'Competitor',
  interview_transcript: 'Interview',
  customer_insight: 'Insight',
  founder_selection: 'Selection',
  synthesized_answer: 'Synthesis',
  research_note: 'Note',
  document: 'Document',
};

interface KnowledgeEntryRowProps {
  entry: KnowledgeEntry;
  relatedEntries?: Array<{ id: string; title: string; type: string }>;
  referencingOutcomes?: Array<{ id: string; title: string; decision: string }>;
  onOpen?: (entryId: string) => void;
  onOpenEntry?: (entryId: string) => void;
  onOpenOutcome?: (outcomeId: string) => void;
  className?: string;
}

export function KnowledgeEntryRow({
  entry,
  relatedEntries,
  referencingOutcomes,
  onOpen,
  onOpenEntry,
  onOpenOutcome,
  className,
}: KnowledgeEntryRowProps) {
  const Icon = TYPE_ICON[entry.type];
  const isSelection = entry.type === 'founder_selection';

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3 transition-colors hover:bg-[var(--surface-2)]',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-muted)] shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpen?.(entry.id)}
              className="font-medium text-sm text-[var(--text-primary)] hover:underline text-left"
            >
              {entry.title}
            </button>
            <Badge
              className={cn(
                'text-2xs',
                isSelection
                  ? 'bg-[var(--agent-strategy-muted)] text-[var(--agent-strategy)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              )}
            >
              {TYPE_LABEL[entry.type]}
            </Badge>
            {entry.confidence !== undefined && (
              <span className="text-2xs text-[var(--text-muted)] tabular-nums">
                {entry.confidence}%
              </span>
            )}
            <TraceButton id={entry.id} kind="knowledge" />
            <TraceButton id={entry.id} kind="knowledge" />
          </div>

          <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
            {entry.summary}
          </p>

          <div className="mt-2 flex items-center gap-3 text-2xs text-[var(--text-muted)]">
            {entry.contributingAgent && (
              <span className="inline-flex items-center gap-1">
                <AgentIcon agent={entry.contributingAgent} size={10} />
                {entry.contributingAgent}
              </span>
            )}
            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            {entry.tags && entry.tags.length > 0 && (
              <span className="truncate">{entry.tags.slice(0, 3).join(' · ')}</span>
            )}
          </div>

          <ConnectedWeb
            entry={entry}
            relatedEntries={relatedEntries}
            referencingOutcomes={referencingOutcomes}
            onOpenEntry={onOpenEntry}
            onOpenOutcome={onOpenOutcome}
          />
        </div>
      </div>
    </div>
  );
}
