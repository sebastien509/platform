import { useState } from 'react';
import { ChevronDown, ChevronUp, Link2, FileText, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { KnowledgeEntry } from '@/lib/types';

interface ConnectedWebProps {
  entry: KnowledgeEntry;
  /** Resolved neighbours for display. Caller does the lookup. */
  relatedEntries?: Array<{ id: string; title: string; type: string }>;
  /** Resolved outcomes that cite this entry. */
  referencingOutcomes?: Array<{ id: string; title: string; decision: string }>;
  onOpenEntry?: (entryId: string) => void;
  onOpenOutcome?: (outcomeId: string) => void;
  className?: string;
}

export function ConnectedWeb({
  entry,
  relatedEntries = [],
  referencingOutcomes = [],
  onOpenEntry,
  onOpenOutcome,
  className,
}: ConnectedWebProps) {
  const [open, setOpen] = useState(false);

  const hasOrigin = !!entry.sourceIdeaId || !!entry.sourceVentureId;
  const hasRelated = relatedEntries.length > 0;
  const hasOutcomes = referencingOutcomes.length > 0;
  const total = relatedEntries.length + referencingOutcomes.length;

  if (!hasOrigin && !hasRelated && !hasOutcomes) return null;

  return (
    <div className={cn('mt-2', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <Link2 className="h-3 w-3" />
        {open ? 'Hide connected web' : `Connected web · ${total} link${total === 1 ? '' : 's'}`}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
          {hasOrigin && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Originating from
              </p>
              <p className="mt-1 text-xs text-[var(--text-primary)]">
                {entry.sourceIdeaId && <span>Idea {entry.sourceIdeaId}</span>}
                {entry.sourceIdeaId && entry.sourceVentureId && ' · '}
                {entry.sourceVentureId && <span>Venture {entry.sourceVentureId}</span>}
              </p>
            </div>
          )}

          {hasRelated && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Related entries
              </p>
              <ul className="mt-1.5 space-y-1">
                {relatedEntries.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEntry?.(r.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <FileText className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-2xs text-[var(--text-muted)]">{r.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasOutcomes && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Referenced by outcomes
              </p>
              <ul className="mt-1.5 space-y-1">
                {referencingOutcomes.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onOpenOutcome?.(o.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Trophy className="h-3 w-3 shrink-0 text-[var(--success)]" />
                      <span className="flex-1 truncate">{o.title}</span>
                      <span className="text-2xs uppercase text-[var(--text-muted)]">
                        {o.decision}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
