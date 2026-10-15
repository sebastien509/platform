import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IdeaStage } from '../primitives';
import { getIdeaAgent } from '../agent';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { DocumentViewerDrawer } from '@/features/venture-docs/DocumentViewerDrawer';
import { cn } from '@/lib/utils/cn';
import type {
  ResearchRunState,
  ResearchEntry,
  ResearchThread,
  ResearchThreadKind,
  StructuredIdeaCard,
} from '@/lib/types';

interface ResearchStageProps {
  ideaId: string;
  runState: ResearchRunState;
  structured: StructuredIdeaCard;
  rawCapture: string;
  entries: ResearchEntry[];
  onRunStateChange: (next: ResearchRunState) => void;
  /** Write-through updater — reads the LATEST run state from the
   *  store before applying. Prevents stale-prop overwrites when a
   *  thread completes between render and click. */
  onRunStateUpdate?: (fn: (latest: ResearchRunState) => ResearchRunState) => void;
  onEntriesChange: (next: ResearchEntry[]) => void;
  onComplete: (state: ResearchRunState) => void;
}

const KIND_ORDER: ResearchThreadKind[] = ['market', 'competitor', 'customer'];
const TOTAL = KIND_ORDER.length;

const KIND_LABEL: Record<ResearchThreadKind, string> = {
  market: 'Market sizing',
  competitor: 'Competitive landscape',
  customer: 'Customer interviews',
};

function rid() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function ResearchStage({
  ideaId,
  runState,
  structured,
  rawCapture,
  entries,
  onRunStateChange,
  onRunStateUpdate,
  onEntriesChange,
  onComplete,
}: ResearchStageProps) {
  const [activeReport, setActiveReport] = useState<ResearchEntry | null>(null);
  const [liveRunId, setLiveRunId] = useState<string | null>(null);
  const [threadIndex, setThreadIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const startRun = useAgentDrawerStore((s) => s.startRun);
  const updateRun = useAgentDrawerStore((s) => s.updateRun);
  const emitBlock = useAgentDrawerStore((s) => s.emitBlock);
  const endRun = useAgentDrawerStore((s) => s.endRun);

  const liveRun = useAgentDrawerStore((s) =>
    liveRunId ? s.runs[liveRunId] : undefined
  );

  const bootRef = useRef(false);
  const runIdRef = useRef<string | null>(null);
  const runStateRef = useRef(runState);
  const entriesRef = useRef(entries);

  useEffect(() => { runStateRef.current = runState; }, [runState]);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  /* ── Derive per-kind status from the live run's blocks ── */
  const derivedStatus = useMemo(() => {
    const result: Record<
      ResearchThreadKind,
      { status: 'pending' | 'running' | 'complete' | 'failed'; entry?: ResearchEntry; summary?: string }
    > = {
      market: { status: 'pending' },
      competitor: { status: 'pending' },
      customer: { status: 'pending' },
    };
    const blocks = liveRun?.blocks ?? [];

    for (const kind of KIND_ORDER) {
      const label = KIND_LABEL[kind].toLowerCase();
      const startStep = blocks.find(
        (b) =>
          b.type === 'step' &&
          typeof (b as any).label === 'string' &&
          (b as any).label.toLowerCase().includes(`researching: ${label}`),
      );
      const output = blocks.find((b) => {
        if (b.type !== 'output') return false;
        const dest = String((b as any).destination ?? '').toLowerCase();
        const title = String((b as any).title ?? '').toLowerCase();
        return dest.includes(label) || title.includes(label);
      });
      const failure = blocks.find(
        (b) =>
          b.type === 'error' &&
          (b as any).message?.toLowerCase().includes(label),
      );

      if (output) {
        const entry = (output as any).payload?.researchEntry as ResearchEntry | undefined;
        result[kind] = { status: 'complete', entry, summary: entry?.summary };
      } else if (startStep) {
        result[kind] = { status: failure ? 'failed' : 'running' };
      }
    }
    return result;
  }, [liveRun]);

  /* ── Boot ── */
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    if (runState.status !== 'idle' && runState.threads.length > 0) {
      setStarted(true);
      return;
    }

    const runId = startRun({
      agentId: 'research',
      objective: 'Starting research…',
      ideaId,
      conversationMode: false,
      page: 'knowledge' as any,
    } as any);

    runIdRef.current = runId;
    setLiveRunId(runId);

    updateRun(runId, {
      opId: 'research.run',
      opIcon: 'search',
      opVerb: 'Research',
    } as any);

    emitBlock({
      id: rid(),
      runId,
      agentId: 'research',
      createdAt: new Date().toISOString(),
      type: 'step',
      label: 'Reading your capture and structured card',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    /* Do NOT auto-open the drawer. The file cards on this page
     * are the primary UI for research — the drawer would duplicate
     * the same state in a second surface with different timing.
     * The founder can open the drawer manually via the run dock
     * if they want the block timeline. */
    setStarted(true);
  }, [ideaId, runState.status, runState.threads.length, startRun, updateRun, emitBlock]);

  /* ── Sequential thread processing ── */
  useEffect(() => {
    if (!started) return;

    if (threadIndex >= KIND_ORDER.length) {
      const runId = runIdRef.current;
      if (runId) {
        const currentRun = useAgentDrawerStore.getState().runs[runId];
        if (currentRun && currentRun.status !== 'review_ready') {
          const nextBlocks = currentRun.blocks.map((b) =>
            b.type === 'status'
              ? { ...b, state: 'review_ready' as const, objective: 'All research complete — 3 memos ready to review' }
              : b,
          );
          updateRun(runId, { status: 'review_ready', blocks: nextBlocks } as any);
        }
      }
      return;
    }

    const kind = KIND_ORDER[threadIndex];
    const runId = runIdRef.current;
    if (!runId) return;

    const currentRunState = runStateRef.current;
    const currentEntries = entriesRef.current;
    const existing = currentRunState.threads.find((t) => t.id === `th_${kind}`);
    if (existing?.status === 'complete') {
      setThreadIndex((i) => i + 1);
      return;
    }

    let cancelled = false;
    const now = new Date().toISOString();
    const thread: ResearchThread = existing ?? {
      id: `th_${kind}`,
      kind,
      label: KIND_LABEL[kind],
      status: 'running',
      startedAt: now,
      origin: 'initial',
      requiresReview: true,
    };

    const nextThreads = existing
      ? currentRunState.threads.map((t) =>
          t.id === thread.id ? { ...t, status: 'running' as const } : t,
        )
      : [...currentRunState.threads, { ...thread, status: 'running' as const }];

    onRunStateChange({
      ...currentRunState,
      threads: nextThreads,
      status: 'running',
    });

    emitBlock({
      id: rid(),
      runId,
      agentId: 'research',
      createdAt: new Date().toISOString(),
      type: 'step',
      label: `Researching: ${KIND_LABEL[kind].toLowerCase()}`,
      startedAt: new Date().toISOString(),
    });

    (async () => {
      try {
        const priorEntriesSummary = currentEntries.map((e) => ({
          kind: e.kind,
          title: e.title,
          summary: e.summary,
        }));

        const out = await getIdeaAgent().researchThread({
          kind,
          rawCapture,
          structured,
          priorEntriesSummary,
        });

        if (cancelled) return;

        const entry: ResearchEntry = {
          id: `re_${kind}_${Date.now().toString(36)}`,
          kind,
          title: out.entry.title,
          summary: out.entry.summary,
          html: (out.entry as any).html ?? null,
          sections: out.entry.sections,
          confidence: out.entry.confidence,
          founderPrompt: out.entry.founderPrompt,
          createdAt: new Date().toISOString(),
        };

        onEntriesChange([...entriesRef.current, entry]);

        const finalThreads = nextThreads.map((t) =>
          t.id === thread.id
            ? {
                ...t,
                status: 'complete' as const,
                completedAt: new Date().toISOString(),
                knowledgeEntryId: entry.id,
                summary: entry.summary,
              }
            : t,
        );
        const allComplete = finalThreads.every(
          (t) => t.status === 'complete' || t.status === 'failed',
        );
        onRunStateChange({
          ...currentRunState,
          threads: finalThreads,
          status: allComplete ? 'complete' : 'running',
        });

        emitBlock({
          id: rid(),
          runId,
          agentId: 'research',
          createdAt: new Date().toISOString(),
          type: 'output',
          kind: 'document',
          title: entry.title,
          destination: `Research › ${KIND_LABEL[kind]}`,
          status: 'needs_review',
          previewHref: `research:${entry.id}`,
          payload: { researchEntry: entry },
        } as any);

        setThreadIndex((i) => i + 1);
      } catch (e) {
        if (cancelled) return;
        console.error('[research] thread failed', kind, e);

        const errThreads = nextThreads.map((t) =>
          t.id === thread.id ? { ...t, status: 'failed' as const } : t,
        );
        onRunStateChange({
          ...currentRunState,
          threads: errThreads,
          status: 'running',
        });

        emitBlock({
          id: rid(),
          runId,
          agentId: 'research',
          createdAt: new Date().toISOString(),
          type: 'error',
          message: `Couldn't complete ${KIND_LABEL[kind].toLowerCase()}`,
          actions: ['retry', 'ignore'],
        });

        setThreadIndex((i) => i + 1);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadIndex, started]);

  function handleOpenEntry(entry: ResearchEntry) {
    setActiveReport(entry);

    /* Write-through: read the LATEST run state from the store so
     * a thread that completed between render and click isn't
     * clobbered. Falls back to the prop if the updater isn't
     * provided (mock / standalone usage). */
    if (onRunStateUpdate) {
      onRunStateUpdate((latest) => {
        const viewed = latest.viewedReportIds ?? [];
        if (viewed.includes(entry.id)) return latest;
        return { ...latest, viewedReportIds: [...viewed, entry.id] };
      });
    } else {
      const viewed = runState.viewedReportIds ?? [];
      if (!viewed.includes(entry.id)) {
        onRunStateChange({ ...runState, viewedReportIds: [...viewed, entry.id] });
      }
    }
  }

  /* ── Completion accounting ── */
  const completedCount = KIND_ORDER.filter((k) => derivedStatus[k].status === 'complete').length;
  const failedCount = KIND_ORDER.filter((k) => derivedStatus[k].status === 'failed').length;
  const allDone = completedCount === TOTAL;

  const reviewedCount = useMemo(() => {
    const viewed = new Set(runState.viewedReportIds ?? []);
    return KIND_ORDER.filter((k) => {
      const entry = derivedStatus[k].entry ?? entries.find((e) => e.kind === k);
      return Boolean(entry && viewed.has(entry.id));
    }).length;
  }, [runState.viewedReportIds, derivedStatus, entries]);

  const allReviewed = reviewedCount === TOTAL;
  const remaining = TOTAL - reviewedCount;

  function handleContinue() {
    const runId = runIdRef.current;
    if (runId) {
      const currentRun = useAgentDrawerStore.getState().runs[runId];
      if (currentRun) {
        const nextBlocks = currentRun.blocks.map((b) =>
          b.type === 'output' ? { ...b, status: 'approved' as const } : b,
        );
        updateRun(runId, { blocks: nextBlocks } as any);
      }
      endRun(runId, 'done' as any);
    }
    const next: ResearchRunState = {
      ...runState,
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
    };
    onRunStateChange(next);
    setTimeout(() => onComplete(next), 200);
  }

  const currentlyRunning = threadIndex < KIND_ORDER.length ? KIND_ORDER[threadIndex] : null;

  /* ── Render ── */
  return (
    <>
      <IdeaStage>
        <div className="idea-focus idea-focus--research">
          {/* Top: progress OR review banner */}
          {!allDone ? (
            <div className="research-topbar">
              <div className="research-topbar__bar">
                <div
                  className="research-topbar__fill"
                  style={{ width: `${(completedCount / TOTAL) * 100}%` }}
                />
              </div>
              <div className="research-topbar__meta">
                <span className="research-topbar__count">
                  {completedCount} of {TOTAL} memos ready
                </span>
                <span className="research-topbar__running">
                  {currentlyRunning
                    ? `Producing: ${KIND_LABEL[currentlyRunning].toLowerCase()}…`
                    : 'Preparing research…'}
                </span>
              </div>
              {failedCount > 0 && (
                <p className="research-topbar__error">
                  {failedCount} {failedCount === 1 ? 'memo' : 'memos'} couldn't complete — you can still proceed with what we have.
                </p>
              )}
            </div>
          ) : allReviewed ? (
            <div className="research-banner is-complete">
              <span className="research-banner__icon">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="research-banner__body">
                <span className="research-banner__title">All memos reviewed</span>
                <span className="research-banner__sub">
                  Validate this research pass to continue.
                </span>
              </div>
            </div>
          ) : (
            <div className="research-banner">
              <span className="research-banner__icon">
                <FileText className="h-4 w-4" />
              </span>
              <div className="research-banner__body">
                <span className="research-banner__title">
                  Review all three memos to continue
                </span>
                <span className="research-banner__sub">
                  {reviewedCount} of {TOTAL} reviewed — open each memo below.
                </span>
              </div>
            </div>
          )}

          {/* File list */}
          <div className="research-file-list">
            {KIND_ORDER.map((kind) => {
              const derived = derivedStatus[kind];
              const status = derived.status;
              const entry = derived.entry ?? entries.find((e) => e.kind === kind);
              const isReviewed = Boolean(entry && runState.viewedReportIds?.includes(entry.id));
              const canOpen = status === 'complete' && !!entry;

              return (
                <button
                  key={kind}
                  type="button"
                  className={cn(
                    'research-file-card',
                    `is-${status}`,
                    isReviewed && 'is-reviewed',
                  )}
                  disabled={!canOpen}
                  onClick={() => entry && handleOpenEntry(entry)}
                >
                  <div className="research-file-card__top">
                    <span className="research-file-card__chip">
                      {status === 'running' ? (
                        <Loader2 className="h-4 w-4 research-file-card__spin" />
                      ) : status === 'failed' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <span className={cn('research-file-card__badge', `is-${status}`)}>
                      {status === 'complete' && isReviewed
                        ? 'Reviewed'
                        : status === 'complete'
                          ? 'Ready'
                          : status === 'running'
                            ? 'Running'
                            : status === 'failed'
                              ? 'Failed'
                              : 'Pending'}
                    </span>
                  </div>
                  <h3 className="research-file-card__title">{KIND_LABEL[kind]}</h3>
                  <p className="research-file-card__summary">
                    {entry?.summary ?? 'Waiting…'}
                  </p>
                  <span className="research-file-card__review is-primary">
                    {isReviewed ? 'Open again' : 'Open file'}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Continue — always visible */}
          <div className="research-file-actions">
            <button
              type="button"
              className="research-file-actions__primary"
              onClick={handleContinue}
              disabled={!allReviewed}
              title={
                allReviewed
                  ? 'Continue to the next stage'
                  : `Open all three memos first (${reviewedCount} of ${TOTAL} reviewed)`
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {allReviewed
                ? 'Validate research & continue'
                : `Review ${remaining} more ${remaining === 1 ? 'memo' : 'memos'}`}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </IdeaStage>

      <DocumentViewerDrawer
        document={
          activeReport
            ? ({
                id: activeReport.id,
                title: activeReport.title,
                summary: activeReport.summary,
                kind: 'research_report',
                ventureId: ideaId,
                status: 'approved',
                content: '',
                html: activeReport.html ?? null,
                sections: activeReport.sections,
                citations: [],
                producedBy: 'knowledge',
                consumedFrom: [],
                isHeadline: false,
                builtOnDraftInput: false,
                createdAt: activeReport.createdAt,
                updatedAt: activeReport.createdAt,
              } as any)
            : null
        }
        onClose={() => setActiveReport(null)}
      />
    </>
  );
}
