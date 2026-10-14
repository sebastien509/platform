import { Check, Eye, Loader2, XCircle, ArrowRight, FileText, RotateCw, ArrowUpRight, EyeOff } from 'lucide-react';
import { DrawerShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ResearchThread, ResearchRunState } from '@/lib/types';

export type ThreadAction = 'retry' | 'escalate' | 'ignore';

interface ResearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runState: ResearchRunState;
  onOpenReport: (knowledgeEntryId: string) => void;
  onAcknowledge: () => void;
  onThreadAction?: (threadId: string, action: ThreadAction) => void;
}

export function ResearchDrawer({
  open,
  onOpenChange,
  runState,
  onOpenReport,
  onAcknowledge,
  onThreadAction,
}: ResearchDrawerProps) {
  const { threads, viewedReportIds, status } = runState;
  const completed = threads.filter((t) => t.status === 'complete');
  const failedUnresolved = threads.filter(
    (t) => t.status === 'failed' && !t.failureResolved
  );

  /* Reports that must be opened before the gate unlocks */
  const requiredReportIds = completed
    .filter((t) => t.requiresReview)
    .map((t) => t.knowledgeEntryId)
    .filter((id): id is string => !!id);

  const allViewed =
    requiredReportIds.length > 0 &&
    requiredReportIds.every((id) => viewedReportIds.includes(id));

  /* Failed threads must be resolved before the gate unlocks */
  const allFailuresResolved = failedUnresolved.length === 0;

  /* Gate unlocks only when BOTH conditions hold */
  const canAcknowledge =
    (requiredReportIds.length === 0 || allViewed) && allFailuresResolved;

  const isAcknowledged = status === 'acknowledged';
  const isRunning = threads.some((t) => t.status === 'running');

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Research Library"
      description={
        isRunning
          ? 'Reports appear as threads complete.'
          : isAcknowledged
          ? 'Reviewed and acknowledged.'
          : 'Open each report, resolve any failures, then acknowledge.'
      }
      side="right"
      width={480}
    >
      <div className="space-y-4 py-4">
        {/* Progress counter */}
        <div className="flex items-center gap-3 text-2xs text-[var(--text-muted)]">
          <span className="tabular-nums">
            {completed.length} of {threads.length} complete
          </span>
          {failedUnresolved.length > 0 && (
            <span className="text-[var(--error)]">
              · {failedUnresolved.length} needing resolution
            </span>
          )}
          {isAcknowledged && (
            <span className="text-[var(--success)] inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> Acknowledged
            </span>
          )}
        </div>

        {/* Report rows */}
        <ul className="space-y-1">
          {threads.map((thread) => (
            <ReportRow
              key={thread.id}
              thread={thread}
              isViewed={
                thread.knowledgeEntryId
                  ? viewedReportIds.includes(thread.knowledgeEntryId)
                  : false
              }
              onOpen={onOpenReport}
              onThreadAction={onThreadAction}
            />
          ))}
        </ul>

        {/* Acknowledgment action */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          {isAcknowledged ? (
            <div className="flex items-center gap-2 text-sm text-[var(--success)]">
              <Check className="h-4 w-4" />
              Review complete — Synthesize can begin.
            </div>
          ) : (
            <>
              <Button
                onClick={onAcknowledge}
                disabled={!canAcknowledge}
                className="w-full gap-1.5"
              >
                I've reviewed this
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              {!canAcknowledge && (
                <p className="mt-2 text-2xs text-[var(--text-muted)] text-center">
                  {!allFailuresResolved
                    ? 'Resolve each failed thread to continue.'
                    : 'Open each completed report to unlock this.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}

function ReportRow({
  thread,
  isViewed,
  onOpen,
  onThreadAction,
}: {
  thread: ResearchThread;
  isViewed: boolean;
  onOpen: (id: string) => void;
  onThreadAction?: (threadId: string, action: ThreadAction) => void;
}) {
  const isComplete = thread.status === 'complete';
  const isRunning = thread.status === 'running';
  const isFailed = thread.status === 'failed';
  const isPending = thread.status === 'pending';
  const isResolved = !!thread.failureResolved && thread.failureResolved !== 'retry';

  return (
    <li
      className={cn(
        'rounded-lg p-3 transition-colors',
        isComplete && !isViewed && 'bg-[var(--surface-2)]',
        isFailed && !isResolved && 'bg-[oklch(67%_0.191_27.2/6%)] border-l-2 border-[var(--error)]',
        isFailed && isResolved && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {isComplete && (
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md',
                isViewed
                  ? 'bg-[var(--success-muted)] text-[var(--success)]'
                  : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
              )}
            >
              {isViewed ? <Eye className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            </span>
          )}
          {isRunning && (
            <span className="flex h-5 w-5 items-center justify-center text-[var(--info)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
            </span>
          )}
          {isFailed && (
            <span className="flex h-5 w-5 items-center justify-center text-[var(--error)]">
              <XCircle className="h-3.5 w-3.5" />
            </span>
          )}
          {isPending && (
            <span className="flex h-5 w-5 items-center justify-center text-[var(--text-muted)]">
              <FileText className="h-3 w-3" />
            </span>
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {thread.label}
            {isFailed && isResolved && (
              <span className="ml-2 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-2xs font-medium text-[var(--text-muted)] uppercase">
                {thread.failureResolved}
              </span>
            )}
          </p>
          {thread.summary && (
            <p className="mt-0.5 text-2xs text-[var(--text-muted)]">
              {thread.summary}
            </p>
          )}
          {isRunning && (
            <p className="mt-0.5 text-2xs text-[var(--text-muted)]">generating…</p>
          )}
          {isFailed && !isResolved && (
            <p className="mt-0.5 text-2xs text-[var(--error)]">
              Thread failed — resolve to continue.
            </p>
          )}

          {/* Failure recovery actions */}
          {isFailed && !isResolved && onThreadAction && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onThreadAction(thread.id, 'retry')}
                className="inline-flex items-center gap-1 rounded-md border border-transparent bg-[var(--accent-muted)] px-2 py-1 text-2xs font-medium text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <RotateCw className="h-3 w-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => onThreadAction(thread.id, 'escalate')}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-2xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowUpRight className="h-3 w-3" />
                Escalate
              </button>
              <button
                type="button"
                onClick={() => onThreadAction(thread.id, 'ignore')}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-2xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <EyeOff className="h-3 w-3" />
                Ignore
              </button>
            </div>
          )}
        </div>

        {isComplete && thread.knowledgeEntryId && (
          <button
            type="button"
            onClick={() => onOpen(thread.knowledgeEntryId!)}
            className={cn(
              'shrink-0 self-start rounded-md px-2 py-1 text-2xs font-medium transition-colors',
              isViewed
                ? 'text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]'
                : 'bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent-muted)]/80'
            )}
          >
            {isViewed ? 'View again' : 'Open'}
          </button>
        )}
      </div>
    </li>
  );
}
