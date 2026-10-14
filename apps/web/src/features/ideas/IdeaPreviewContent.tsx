import { Idea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhasePill } from '@/components/ideas/PhasePill';
import { StatusBadge } from '@/components/status';
import {
  Lightbulb,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface IdeaPreviewContentProps {
  idea: Idea;
  onOpenFull: () => void;
}

export function IdeaPreviewContent({
  idea,
  onOpenFull,
}: IdeaPreviewContentProps) {
  const evidenceCount = idea.context?.evidence?.length || 0;
  const checkpointCount = idea.context?.checkpoints?.length || 0;
  const pendingCheckpoints =
    idea.context?.checkpoints?.filter((c: any) => c.status === 'pending')
      .length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <PhasePill phase={idea.phase} />
        <StatusBadge status={idea.status} dot />
      </div>

      {idea.problem && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <Lightbulb className="h-4 w-4 text-[var(--accent)]" />
            Problem
          </h4>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {idea.problem}
          </p>
        </section>
      )}

      {idea.hypothesis && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <FileText className="h-4 w-4 text-[var(--accent)]" />
            Hypothesis
          </h4>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {idea.hypothesis}
          </p>
        </section>
      )}

      {idea.audience && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            Audience
          </h4>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {idea.audience}
          </p>
        </section>
      )}

      <section className="grid grid-cols-3 gap-3">
        <StatCell value={evidenceCount} label="Evidence" />
        <StatCell value={checkpointCount} label="Checkpoints" />
        <StatCell value={`${idea.progress}%`} label="Progress" />
      </section>

      {pendingCheckpoints > 0 && (
        <div className="rounded-lg border border-[var(--warning-muted)] bg-[var(--warning-muted)] p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--warning)]">
            <Clock className="h-4 w-4" />
            {pendingCheckpoints} pending checkpoint
            {pendingCheckpoints === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Open the full idea to resolve.
          </p>
        </div>
      )}

      <Button className="w-full gap-2" onClick={onOpenFull}>
        <CheckCircle2 className="h-4 w-4" />
        Open full idea
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function StatCell({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-3 text-center">
      <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
      <p className="text-2xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}