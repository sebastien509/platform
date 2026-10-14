import { FileText, CheckCircle2 } from 'lucide-react';
import type { StructuredIdeaCard, KnowledgeEntry } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface ValidationSummaryProps {
  structured: StructuredIdeaCard;
  /** Knowledge entries that back the card. */
  evidenceEntries: KnowledgeEntry[];
  className?: string;
}

export function ValidationSummary({
  structured,
  evidenceEntries,
  className,
}: ValidationSummaryProps) {
  const fields = [
    structured.problem,
    structured.persona,
    structured.value,
    structured.sector,
  ].filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Idea Card recap */}
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Your idea, as it stands
        </p>
        <div className="space-y-2">
          {fields.map((f) => (
            <div
              key={f.id}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3"
            >
              <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {f.label}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-primary)] leading-relaxed">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence density */}
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Evidence backing this idea
        </p>
        <div className="flex items-center gap-2 rounded-md bg-[var(--surface-2)] p-3">
          <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
          <p className="text-sm text-[var(--text-primary)]">
            <span className="font-medium">{evidenceEntries.length}</span> research{' '}
            {evidenceEntries.length === 1 ? 'report' : 'reports'} attached
          </p>
        </div>

        {evidenceEntries.length > 0 && (
          <ul className="mt-2 space-y-1">
            {evidenceEntries.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                <FileText className="h-3 w-3 text-[var(--text-muted)] mt-0.5 shrink-0" />
                <span className="flex-1">{e.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
