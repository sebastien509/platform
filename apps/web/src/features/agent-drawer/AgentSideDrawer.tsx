import { useEffect, useState } from 'react';
import { X, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useRuns } from '@/lib/hooks/useRuns';
import { getIcon as getAgentIcon, getManifest } from './manifests';
import { getIcon as getOpIcon } from '@/features/venture-pages/iconMap';
import { resumeRun } from '@/features/venture-actions/runAction';
import {
  StepBlockView,
  ErrorBlockView,
  QuestionBlockView,
  FileRequestBlockView,
  ApprovalBlockView,
  OutputBlockView,
} from './blocks';
import type {
  ApprovalBlock,
  ErrorBlock,
  FileRequestBlock,
  OutputBlock,
  QuestionBlock,
  StatusBlock,
  StepBlock,
} from '@/lib/types';

interface AgentSideDrawerProps {
  onOpenDoc?: (href: string) => void;
}

export function AgentSideDrawer({ onOpenDoc }: AgentSideDrawerProps) {
  const open = useAgentDrawerStore((s) => s.open);
  const size = useAgentDrawerStore((s) => s.size);
  const close = useAgentDrawerStore((s) => s.closeDrawer);
  const activeRunId = useAgentDrawerStore((s) => s.activeRunId);
  const runs = useAgentDrawerStore((s) => s.runs);
  const activeVentureId = useAgentDrawerStore((s) => s.activeVentureId);
  const viewOnlyRunId = useAgentDrawerStore((s) => s.viewOnlyRunId);
  const killRun = useAgentDrawerStore((s) => s.killRun);
  const closeBlock = useAgentDrawerStore((s) => s.closeBlock);
  const [confirmKill, setConfirmKill] = useState(false);
  const allAnswers = useAgentDrawerStore((s) => s.runAnswers);

  useRuns({ ventureId: activeVentureId ?? undefined });

  const activeRun = activeRunId ? runs[activeRunId] ?? null : null;
  const isViewOnly =
    Boolean(viewOnlyRunId && viewOnlyRunId === activeRunId) ||
    Boolean(activeRun?.closedAt);

  const displayStatus = (() => {
    if (!activeRun) return null;
    const reason = activeRun.closedReason;
    if (reason === 'validated') return 'validated';
    if (reason === 'failed') return 'failed';
    if (reason === 'abandoned') return 'abandoned';
    if (reason === 'dismissed') return 'dismissed';
    return activeRun.status;
  })();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const statusBlocks = (activeRun?.blocks ?? []).filter(
    (b): b is StatusBlock => b.type === 'status'
  );
  const statusBlock = statusBlocks[statusBlocks.length - 1];

  const stepBlocks =
    activeRun?.blocks.filter((b): b is StepBlock => b.type === 'step') ?? [];
  const errorBlocks =
    activeRun?.blocks.filter((b): b is ErrorBlock => b.type === 'error') ?? [];

  const runAnswers = activeRunId ? allAnswers[activeRunId] ?? {} : {};

  const needsYouBlocks =
    activeRun?.blocks.filter(
      (b): b is QuestionBlock | FileRequestBlock | ApprovalBlock =>
        (b.type === 'question' ||
          b.type === 'file_request' ||
          b.type === 'approval') &&
        !runAnswers[b.id]
    ) ?? [];

  const outputBlocks =
    activeRun?.blocks.filter((b): b is OutputBlock => b.type === 'output') ??
    [];

  const manifest = activeRun ? getManifest(activeRun.agentId) : null;
  const AgentIcon = manifest ? getAgentIcon(manifest.icon) : null;

  const hasAnyBlock =
    Boolean(statusBlock) ||
    stepBlocks.length > 0 ||
    errorBlocks.length > 0 ||
    needsYouBlocks.length > 0 ||
    outputBlocks.length > 0;

  return (
    <aside
      className={cn(
        'agent-drawer',
        `agent-drawer--${size}`,
        open && 'is-open'
      )}
      role="dialog"
      aria-modal="false"
      aria-label="Agent activity"
    >
      <div
        className={cn(
          'agent-drawer__frame',
          isViewOnly && 'is-view-only'
        )}
      >
        {/* Zone 1: header */}
        {activeRun && manifest && AgentIcon && (
          <header className="agent-drawer__header">
            <div className="agent-drawer__identity">
              <span className="agent-drawer__avatar">
                {(() => {
                  const opIconName = (activeRun as any).opIcon;
                  const maybeOpIcon = opIconName ? getOpIcon(opIconName) : null;
                  const OpIcon = (maybeOpIcon ?? AgentIcon) as React.ComponentType<{
                    className?: string;
                  }>;
                  return <OpIcon className="h-4 w-4" />;
                })()}
              </span>
              <div className="agent-drawer__names">
                <span className="agent-drawer__name">
                  {(activeRun as any).opVerb ?? manifest.name}
                </span>
                {activeRun.page && (
                  <span className="agent-drawer__scope">
                    {manifest.name} · {activeRun.page}
                  </span>
                )}
              </div>
            </div>
            <div className="agent-drawer__header-actions">
              <span
                className={cn(
                  'agent-status-pill',
                  `agent-status-pill--${slug(displayStatus ?? activeRun.status)}`
                )}
              >
                <span className="agent-status-pill__dot" />
                {statusLabel(displayStatus ?? activeRun.status)}
              </span>
              <button
                type="button"
                className="agent-drawer-trigger"
                onClick={close}
                aria-label="Close agent drawer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>
        )}

        {/* Discard confirmation — small inline strip */}
        {activeRun && confirmKill && !isViewOnly && (
          <div className="agent-kill-confirm">
            <div className="agent-kill-confirm__body">
              <p className="agent-kill-confirm__title">
                Discard this run?
              </p>
              <p className="agent-kill-confirm__copy">
                {activeRun.status === 'needs_you'
                  ? 'The question will be skipped and no output will be saved to the venture.'
                  : activeRun.status === 'review_ready'
                  ? 'The output will be discarded — nothing lands in the venture.'
                  : 'The run will be aborted. Any output in flight is dropped.'}
              </p>
            </div>
            <div className="agent-kill-confirm__actions">
              <button
                type="button"
                className="agent-kill-confirm__btn"
                onClick={() => setConfirmKill(false)}
              >
                Keep it
              </button>
              <button
                type="button"
                className="agent-kill-confirm__btn is-danger"
                onClick={() => {
                  setConfirmKill(false);
                  killRun(activeRun.id);
                }}
              >
                Yes, discard
              </button>
            </div>
          </div>
        )}

        {/* Zones 2–5: scroll region — Summary → Activity → Needs-you → Outputs */}
        <div className="agent-drawer__scroll">
          {statusBlock && (
            <section className="agent-drawer__summary">
              <span className="agent-drawer__zone-label">Summary</span>
              <p className="agent-summary__text">{statusBlock.objective}</p>
              {statusBlock.progress && statusBlock.progress.total > 0 && (
                <div className="agent-summary__progress">
                  <div
                    className="agent-summary__progress-fill"
                    style={{
                      width: `${Math.round(
                        (statusBlock.progress.current /
                          statusBlock.progress.total) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {(stepBlocks.length > 0 || errorBlocks.length > 0) && (
            <section className="agent-drawer__activity">
              <span className="agent-drawer__zone-label">
                Activity
                <span className="agent-drawer__zone-count">
                  {stepBlocks.length + errorBlocks.length}
                </span>
              </span>
              <ol className="agent-activity__list">
                {stepBlocks.map((b) => (
                  <StepBlockView key={b.id} block={b} />
                ))}
                {errorBlocks.map((b) => (
                  <ErrorBlockView key={b.id} block={b} />
                ))}
              </ol>
            </section>
          )}

          {/* Needs-you — questions, file requests, approvals.
              Rendered inline, right after activity, so the answer
              feels like the next turn in the conversation. */}
          {needsYouBlocks.length > 0 && !isViewOnly && (
            <section className="agent-drawer__needs-you-inline">
              <div className="agent-drawer__needs-you-stack">
                {needsYouBlocks.map((block) => {
                  if (block.type === 'question') {
                    return (
                      <QuestionBlockView
                        key={block.id}
                        block={block}
                        onAnswer={(blockId, value) => {
                          closeBlock(block.runId, blockId, 'answered');
                          resumeRun(block.runId, blockId, value);
                        }}
                      />
                    );
                  }
                  if (block.type === 'file_request') {
                    return (
                      <FileRequestBlockView
                        key={block.id}
                        block={block}
                        onFileRequest={(blockId) => {
                          closeBlock(block.runId, blockId, 'file_attached');
                          resumeRun(block.runId, blockId, 'file_attached');
                        }}
                      />
                    );
                  }
                  if (block.type === 'approval') {
                    return (
                      <ApprovalBlockView
                        key={block.id}
                        block={block}
                        onOpenDoc={onOpenDoc}
                        onApprove={(blockId) => {
                          closeBlock(block.runId, blockId, 'approved');
                          resumeRun(block.runId, blockId, 'approved');
                        }}
                        onReject={(blockId) => {
                          closeBlock(block.runId, blockId, 'rejected');
                          resumeRun(block.runId, blockId, 'rejected');
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          )}

          {outputBlocks.length > 0 && (
            <section className="agent-drawer__outputs">
              <span className="agent-drawer__zone-label">
                Outputs
                <span className="agent-drawer__zone-count">
                  {outputBlocks.length}
                </span>
              </span>
              <ul className="agent-outputs__list">
                {outputBlocks.map((b) => (
                  <OutputBlockView key={b.id} block={b} onReview={onOpenDoc} />
                ))}
              </ul>
            </section>
          )}

          {!hasAnyBlock && (
            <div className="agent-drawer__empty">No activity yet.</div>
          )}
        </div>

        {/* Zone 6: completion footer — read-only informational */}
        {activeRun && activeRun.status === 'done' && outputBlocks.length > 0 && (
          <div className="agent-drawer__complete">
            <span className="agent-drawer__complete-icon">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="agent-drawer__complete-body">
              <p className="agent-drawer__complete-title">Operation complete</p>
              <p className="agent-drawer__complete-copy">
                Saved to Knowledge · {outputBlocks.length}{' '}
                {outputBlocks.length === 1 ? 'artifact' : 'artifacts'} validated
              </p>
            </div>
          </div>
        )}

        {/* Zone 8: footer — destructive action, bottom-right. */}
        {activeRun && !activeRun.closedAt && !isViewOnly && !confirmKill && (
          <footer className="agent-drawer__footer">
            <button
              type="button"
              className="agent-drawer__discard"
              onClick={() => setConfirmKill(true)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Discard run
            </button>
          </footer>
        )}
      </div>
    </aside>
  );
}

/* ---------- Helpers ---------- */

function slug(state: string): string {
  return state.replace(/_/g, '-');
}

function statusLabel(state: string): string {
  const labels: Record<string, string> = {
    working: 'Working',
    needs_you: 'Needs you',
    review_ready: 'Review ready',
    done: 'Done',
    failed: 'Failed',
    paused: 'Paused',
    validated: 'Validated',
    abandoned: 'Abandoned',
    dismissed: 'Dismissed',
  };
  return labels[state] ?? state;
}
