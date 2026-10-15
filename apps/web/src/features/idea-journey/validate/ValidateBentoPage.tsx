import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Users,
  Sparkles,
  Layers,
  FileText,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Plus,
  XCircle,
} from 'lucide-react';
import { ValidationDecision } from './ValidationDecision';
import { ValidationStatusBanner } from './ValidationStatusBanner';
import { ResearchMorePicker } from './ResearchMorePicker';
import { useResearchRun } from './useResearchRun';
import { VentureCountGate } from '@/features/upgrade';
import { PlanGateBanner } from '@/features/upgrade/PlanGateBanner';
import type { GateState } from '@/features/upgrade/VentureCountGate';
import { useArchiveVenture, useVentures } from '@/lib/hooks/useVentures';
import { deriveIdeaTitle } from '@/features/ideas/deriveIdeaTitle';
import { TransitionStage } from '../transition/TransitionStage';
import { DocumentViewerDrawer } from '@/features/venture-docs/DocumentViewerDrawer';
import { useVentureStore } from '@/lib/stores/ventureStore';
import { createVentureFromIdea } from '@/lib/factories/createVentureFromIdea';
import { useCurrentWorkspace } from '@/lib/hooks/useWorkspace';
import { useCreateVentureFromIdea } from '@/lib/hooks/useCreateVentureFromIdea';
import { useWorkspacePlan } from '@/lib/hooks/useWorkspacePlan';
import type {
  IdeaJourney,
  ResearchEntry,
  StructuredIdeaCard,
  SynthesisProposal,
  ValidationDecision as VDK,
  WorkspacePlan,
  
  ResearchThreadKind,
} from '@/lib/types';

interface ValidateBentoPageProps {
  ideaTitle?: string;
  journey: IdeaJourney;
  onChange: (next: IdeaJourney) => void;
  plan?: WorkspacePlan;
  onUpgrade?: () => void;
}

type Phase = 'deciding' | 'naming' | 'created' | 'killed';

const FIELD_META: Array<{
  key: keyof StructuredIdeaCard;
  label: string;
  icon: typeof AlertCircle;
}> = [
  { key: 'problem', label: 'Problem', icon: AlertCircle },
  { key: 'persona', label: 'Persona', icon: Users },
  { key: 'value', label: 'Value', icon: Sparkles },
  { key: 'sector', label: 'Sector', icon: Layers },
];

const KIND_LABEL: Record<ResearchThreadKind, string> = {
  market: 'Market sizing',
  competitor: 'Competitive landscape',
  customer: 'Customer interviews',
};

function deriveHeadline(
  headline: string | undefined,
  value: string | undefined
): string | undefined {
  if (headline && headline.trim()) return headline;
  const v = value?.trim();
  if (!v) return undefined;
  const firstSentence = v.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= 70) return firstSentence;
  return firstSentence.slice(0, 70).trimEnd() + '…';
}

function confidenceTone(value: number | undefined): 'high' | 'medium' | 'low' {
  if (value == null) return 'medium';
  if (value >= 80) return 'high';
  if (value >= 65) return 'medium';
  return 'low';
}

export function ValidateBentoPage({
  journey,
  ideaTitle,
  
  onChange,
  plan,
  onUpgrade,
}: ValidateBentoPageProps) {

  const navigate = useNavigate();

  /* ── Display values — prefer the finalized LLM output ──
   * The finalize step produces the coherent card: a 5-7 word
   * title, a clean overview, and all 4 fields refined. Founder
   * inputs were the grounding; the LLM's version IS the record.
   * Falls back to derive + raw structured for legacy ideas. */
  /* ── Display values ──
   * Priority:
   *   1. journey.finalized — the LLM output from the finalize step
   *      (new ideas). This IS the record.
   *   2. journey.structured — the state loaded from the DB or held
   *      in memory (legacy ideas that predate finalize).
   *   3. deriveIdeaTitle(rawCapture) / synthesisOverview — graceful
   *      fallbacks so the page never renders empty when there's data. */
  const displayTitle =
    journey.finalized?.title ??
    (ideaTitle && ideaTitle !== 'Untitled idea'
      ? ideaTitle
      : deriveIdeaTitle(journey.structured, journey.rawCapture));

  const displayStructured =
    journey.finalized?.structured ??
    journey.structured ?? {
      problem: null,
      persona: null,
      value: null,
      sector: null,
    };

  const displayOverview =
    journey.finalized?.overview ??
    journey.synthesisOverview ??
    '';

  const addVenture = useVentureStore((s) => s.addVenture);
  const { data: workspace } = useCurrentWorkspace();
  const createVentureInDb = useCreateVentureFromIdea();
  const { plan: workspacePlan, isLoading: planLoading } = useWorkspacePlan();

  /* The founder has already made the call — no gates, no upsells. */
  const isDecided = journey.validation.decision !== null
    || Boolean(journey.createdVentureId);

  /* Targeted research from the Validate page. Opens the standard
   * side drawer and appends new entries to journey.researchEntries
   * once the run completes. */
  const runResearch = useResearchRun(journey.ideaId, onChange);
  const [ventureGateOpen, setVentureGateOpen] = useState(false);
  const archiveVenture = useArchiveVenture();
  const venturesQuery = useVentures();
  const activeVenture = (venturesQuery.data ?? []).find(
    (v: any) => !v.archived_at && v.status !== 'archived',
  );
  const activeVentureName = activeVenture?.name;
  const activeVentureIdForArchive = activeVenture?.id;  const [createError, setCreateError] = useState<string | null>(null);

  const researchEntries: ResearchEntry[] = useMemo(
    () => journey.researchEntries ?? [],
    [journey.researchEntries]
  );

  const [phase, setPhase] = useState<Phase>(() => {
    if (journey.validation.decision === 'kill') return 'killed';
    if (journey.createdVentureId) return 'created';
    return 'deciding';
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ResearchEntry | null>(null);

  /* Display title — derived if the caller passed a placeholder. */

  /* Confidence — average of the research entries. */
  const confidence = useMemo(() => {
    if (researchEntries.length === 0) return null;
    const sum = researchEntries.reduce(
      (acc, r) => acc + (r.confidence ?? 60),
      0
    );
    return Math.round(sum / researchEntries.length);
  }, [researchEntries]);

  /* Confirmed field count. */
  const confirmedFields = useMemo(
    () =>
      [
        journey.structured.problem,
        journey.structured.persona,
        journey.structured.value,
        journey.structured.sector,
      ].filter((f) => f?.value?.trim()).length,
    [journey.structured]
  );

  /* Research by id — for evidence chip lookups. */
  const researchById = useMemo(() => {
    const map: Record<string, ResearchEntry> = {};
    for (const r of researchEntries) map[r.id] = r;
    return map;
  }, [researchEntries]);

  /* Accepted proposal per field — drives the "Refined" badge + trail. */
  const acceptedByField = useMemo(() => {
    const map: Partial<Record<SynthesisProposal['fieldKey'], SynthesisProposal>> = {};
    for (const p of journey.synthesisProposals) {
      if (p.status === 'accepted') map[p.fieldKey] = p;
    }
    return map;
  }, [journey.synthesisProposals]);

  /* Signal pair — strongest and weakest research findings. */
  const signals = useMemo(() => {
    if (researchEntries.length === 0) return null;
    const strongest = researchEntries.reduce((best, r) =>
      (r.confidence ?? 0) > (best.confidence ?? 0) ? r : best
    );
    const weakest = researchEntries.reduce((worst, r) =>
      (r.confidence ?? 100) < (worst.confidence ?? 100) ? r : worst
    );
    return { strongest, weakest };
  }, [researchEntries]);

  /* Agent's read — one-line summary of what it did. */
  const agentRead = useMemo(() => {
    const accepted = journey.synthesisProposals.filter(
      (p) => p.status === 'accepted'
    ).length;
    const pending = journey.synthesisProposals.filter(
      (p) => p.status === 'pending'
    ).length;
    if (pending > 0) {
      return `${pending} refinement${
        pending > 1 ? 's' : ''
      } still awaiting review.`;
    }
    if (accepted > 0) {
      return `${accepted} field${accepted > 1 ? 's' : ''} refined from the research.`;
    }
    if (journey.synthesisProposals.length > 0) {
      return 'Research backs the Idea Card as it stands.';
    }
    return 'No synthesis pass yet.';
  }, [journey.synthesisProposals]);

  /* Adaptive hint — only shown when there's something to flag. */
  const decisionHint = useMemo(() => {
    if (confirmedFields === 4 && researchEntries.length >= 2) return null;
    if (confirmedFields === 0 && researchEntries.length === 0) {
      return 'Nothing captured yet. Complete Capture and Clean first.';
    }
    if (researchEntries.length === 0) {
      return `${confirmedFields} of 4 fields confirmed · No research yet.`;
    }
    if (confirmedFields < 4) {
      return `${confirmedFields} of 4 fields confirmed · ${researchEntries.length} research ${
        researchEntries.length === 1 ? 'file' : 'files'
      }.`;
    }
    return null;
  }, [confirmedFields, researchEntries.length]);

  /* Plan source — the caller's prop wins if provided, otherwise
     read from the workspace. Never gate while loading: the
     buttons must stay usable until we know the real state. */
  const effectivePlan: WorkspacePlan = plan ?? workspacePlan;
  const planExhausted = !planLoading
    ? effectivePlan.venturesUsed >= effectivePlan.ventureLimit
    : false;

  /* Gate state — single source of truth for the payment gate.
   *  · none           — Founder / Team, or Pro with a slot open.
   *  · free_to_pro    — Free tier, always blocked at validate.
   *  · pro_to_founder — Pro tier at the 1-venture limit. */
  const gateState: GateState = useMemo(() => {
    if (planLoading || !effectivePlan) return 'none';
    const tier = effectivePlan.tier;
    if (tier === 'starter') return 'free_to_pro';
    if (tier === 'pro' && planExhausted) return 'pro_to_founder';
    return 'none';
  }, [effectivePlan, planLoading, planExhausted]);
  const hasReports = researchEntries.length > 0;
  const isKilled = phase === 'killed';
  function handleDecide(decision: VDK) {
    if (decision === 'continue') {
      /* Intercept at the moment of decision. If gated, open the
       * plan-aware modal instead of advancing to naming. */
      if (gateState !== 'none') {
        setVentureGateOpen(true);
        return;
      }
      setPhase('naming');
      return;
    }
    if (decision === 'kill') {
      onChange({
        ...journey,
        validation: {
          decision: 'kill',
          decidedAt: new Date().toISOString(),
          note: 'Killed at validate.',
        },
        stageStates: { ...journey.stageStates, validate: 'complete' },
        updatedAt: new Date().toISOString(),
      });
      setPhase('killed');
      return;
    }
    if (decision === 'research_more') {
      setPickerOpen(true);
    }
  }

  async function handleCreateVenture(name: string): Promise<string> {
    setCreateError(null);

    if (!workspace?.id) {
      setCreateError('No workspace found. Try refreshing.');
      throw new Error('No workspace');
    }

    /* Real DB write first — if it fails, we haven't touched local state. */
    const venture = await createVentureInDb.mutateAsync({
      ideaId: journey.ideaId,
      workspaceId: workspace.id,
      name: name.trim(),
      description:
        journey.structured.value?.value ??
        journey.structured.problem?.value ??
        'Venture created from an idea.',
      structured: journey.structured,
      researchEntries: researchEntries,
      validation: journey.validation,
    });

    /* Local cache — same id as the DB row, so the UI is consistent. */
    const localVenture = createVentureFromIdea(journey, name.trim());
    addVenture({ ...localVenture, id: venture.id });

    onChange({
      ...journey,
      createdVentureId: venture.id,
      validation: {
        decision: 'continue',
        decidedAt: new Date().toISOString(),
      },
      currentStage: 'transition',
      stageStates: {
        ...journey.stageStates,
        validate: 'complete',
        transition: 'complete',
      },
      updatedAt: new Date().toISOString(),
    });

    setPhase('created');
    return venture.id;
  }

  async function handleArchiveAndSave() {
    if (!activeVentureIdForArchive) {
      setCreateError('No active venture to archive.');
      return;
    }

    try {
      /* 1. Archive the current venture — frees the slot. */
      await archiveVenture.mutateAsync(activeVentureIdForArchive);

      /* 2. Close the gate modal. */
      setVentureGateOpen(false);

      /* 3. Give React Query a beat to refetch workspace-plan so
       *    planExhausted flips to false. */
      await new Promise((r) => setTimeout(r, 350));

      /* 4. Create the new venture — takes over the freed slot. */
      const newVentureId = await handleCreateVenture(displayTitle);

      /* 5. Enter the new venture. */
      navigate(`/ventures/${newVentureId}`);
    } catch (e) {
      setCreateError(
        e instanceof Error ? e.message : 'Could not archive venture.',
      );
    }
  }

  function handleCreateError(message: string) {
    setCreateError(message);
  }

  function handleEnterVenture(ventureId: string) {
    navigate(`/ventures/${ventureId}`);
  }
  return (
    <div className="validate-bento-scroll">

        {/* ── Status banner ──
         * Shows validated / killed / gated state above the cards.
         * The full bento below stays visible — the cards ARE the
         * record of why the decision was made. */}
        {gateState !== 'none' &&
        journey.validation.decision !== 'kill' &&
        !journey.createdVentureId ? (
          <PlanGateBanner
            gateState={gateState}
            currentVentureName={activeVentureName}
            onReviewOptions={() => setVentureGateOpen(true)}
          />
        ) : (
          <ValidationStatusBanner
            journey={journey}
            gated={
              journey.validation.decision !== 'kill' &&
              !journey.createdVentureId &&
              workspacePlan?.tier === 'starter'
            }
          />
        )}

      <div
        className="validate-bento-page"
        data-state={isKilled ? 'killed' : undefined}
      >
        <header className="validate-bento-page__header">
          <span className="validate-bento-page__eyebrow">
            {isKilled ? (
              <XCircle className="h-2.5 w-2.5" />
            ) : (
              <Sparkles className="h-2.5 w-2.5" />
            )}
            {isKilled ? 'Archived' : 'Validate'}
          </span>
          <h1 className="validate-bento-page__title">
            {isKilled ? 'This idea was killed' : displayTitle}
          </h1>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {phase === 'deciding' && (
            <motion.div
              key="bento-grid"
              className="validate-bento"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* ─── Hero: Decision Brief ─── */}
              <motion.div
                layoutId="graduation-surface"
                className="validate-bento__card validate-bento__hero"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="validate-bento__hero-header">
                  <span className="validate-bento__label">Decision brief</span>
                  {confidence != null ? (
                    <div
                      className={`validate-bento__hero-score is-${confidenceTone(
                        confidence
                      )}`}
                    >
                      <span className="validate-bento__hero-score-value">
                        {confidence}
                      </span>
                      <span className="validate-bento__hero-score-unit">%</span>
                    </div>
                  ) : (
                    <span className="validate-bento__badge">
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </span>
                  )}
                </div>

                <div className="validate-bento__hero-copy">
                  {displayOverview && (
                    <p className="validate-bento__hero-brief">
                      {displayOverview}
                    </p>
                  )}

                  {signals && (
                    <dl className="validate-bento__hero-signals">
                      <div className="validate-bento__hero-signal">
                        <dt>Strongest signal</dt>
                        <dd>{signals.strongest.summary}</dd>
                      </div>
                      <div className="validate-bento__hero-signal">
                        <dt>Open question</dt>
                        <dd>{signals.weakest.summary}</dd>
                      </div>
                      <div className="validate-bento__hero-signal">
                        <dt>Agent&rsquo;s read</dt>
                        <dd>{agentRead}</dd>
                      </div>
                    </dl>
                  )}
                </div>

                <div className="validate-bento__hero-actions">
                  {decisionHint && (
                    <p className="validate-bento__hero-hint">{decisionHint}</p>
                  )}
                  <ValidationDecision
                    current={journey.validation.decision}
                    onDecide={handleDecide}
                    disabled={planExhausted}
                  />
                </div>
              </motion.div>

              {/* ─── Four field cards with refinement trail ─── */}
              {FIELD_META.map(({ key, label, icon: Icon }) => {
                const field = displayStructured[key];
                const value = field?.value ?? '';
                const hasValue = Boolean(value.trim());
                const headline = hasValue
                  ? deriveHeadline(field?.headline, value)
                  : undefined;

                const accepted = acceptedByField[key];
                const wasRefined = Boolean(accepted);
                const fieldEvidence = accepted
                  ? accepted.evidenceKnowledgeIds
                      .map((id) => researchById[id])
                      .filter((r): r is ResearchEntry => Boolean(r))
                  : [];

                return (
                  <div
                    key={key}
                    className={`validate-bento__card validate-bento__field${
                      hasValue ? '' : ' is-empty'
                    }${wasRefined ? ' is-refined' : ''}`}
                  >
                    <div className="validate-bento__field-head">
                      <span className="validate-bento__field-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="validate-bento__field-label">
                        {label}
                      </span>
                      <span className="validate-bento__field-status">
                        {hasValue ? (
                          wasRefined ? (
                            <>
                              <Sparkles className="h-3 w-3" />
                              Refined
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmed
                            </>
                          )
                        ) : (
                          'Pending'
                        )}
                      </span>
                    </div>

                    {hasValue ? (
                      <>
                        {headline && (
                          <p className="validate-bento__field-headline">
                            {headline}
                          </p>
                        )}
                        {field?.metrics && field.metrics.length > 0 && (
                          <div className="validate-bento__field-metrics">
                            {field.metrics.map((m) => (
                              <span
                                key={m.label}
                                className="validate-bento__field-metric"
                              >
                                <span className="validate-bento__field-metric-label">
                                  {m.label}
                                </span>
                                <span className="validate-bento__field-metric-value">
                                  {m.value}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        {headline !== value && (
                          <p className="validate-bento__field-caption">
                            {value}
                          </p>
                        )}

                        {field?.context && field.context.length > 0 && (
                          <ul className="validate-bento__field-context">
                            {field.context.slice(0, 2).map((bullet, i) => (
                              <li
                                key={i}
                                className="validate-bento__field-pill"
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}

                        {wasRefined && accepted?.currentValue && (
                          <p className="validate-bento__field-trail">
                            <span className="validate-bento__field-trail-label">
                              Was
                            </span>{' '}
                            {accepted.currentValue}
                          </p>
                        )}

                        {fieldEvidence.length > 0 && (
                          <div className="validate-bento__field-evidence">
                            <span className="validate-bento__field-evidence-label">
                              From
                            </span>
                            {fieldEvidence.map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                className="validate-bento__field-evidence-chip"
                                onClick={() => setActiveReport(e)}
                              >
                                {KIND_LABEL[e.kind] ?? e.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="validate-bento__field-caption">
                        Not yet defined. Run Clean to lock this field.
                      </p>
                    )}
                  </div>
                );
              })}

              {/* ─── Research ─── */}
              <div className="validate-bento__card validate-bento__research">
                <div className="validate-bento__research-head">
                  <div className="validate-bento__research-left">
                    <span className="validate-bento__research-icon">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="validate-bento__research-body">
                      <span className="validate-bento__label">Research</span>
                      <p className="validate-bento__research-count">
                        {researchEntries.length}{' '}
                        {researchEntries.length === 1
                          ? 'research file'
                          : 'research files'}
                      </p>
                      <p className="validate-bento__research-sub">
                        {hasReports
                          ? researchEntries
                              .slice(0, 2)
                              .map((e) => e.title)
                              .join(' · ')
                          : 'No research files yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="validate-bento__research-actions">
                    {/* Only pre-validated ideas can ask for more.
                     * Killed and post-validated ideas keep the
                     * record — no new research. */}
                    {!isDecided && (
                      <button
                        type="button"
                        className="validate-bento__research-link"
                        onClick={() => setPickerOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ask for more
                      </button>
                    )}

                    <button
                      type="button"
                      className="validate-bento__research-link validate-bento__research-link--primary"
                      onClick={() => setReportsOpen((v) => !v)}
                      disabled={!hasReports}
                      aria-expanded={reportsOpen}
                    >
                      {reportsOpen ? 'Hide research' : 'Show research'}
                      <ChevronDown
                        className="validate-bento__research-chevron h-3.5 w-3.5"
                        data-open={reportsOpen || undefined}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {reportsOpen && hasReports && (
                    <motion.ul
                      key="reports-list"
                      className="validate-bento__research-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {researchEntries.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            className="validate-bento__research-row"
                            onClick={() => setActiveReport(entry)}
                          >
                            <span
                              className={`validate-bento__research-row-badge is-${entry.kind}`}
                            >
                              {KIND_LABEL[entry.kind] ?? entry.kind}
                            </span>
                            <div className="validate-bento__research-row-body">
                              <span className="validate-bento__research-row-title">
                                {entry.title}
                              </span>
                              {entry.summary && (
                                <span className="validate-bento__research-row-summary">
                                  {entry.summary}
                                </span>
                              )}
                            </div>
                            <span
                              className={`validate-bento__research-row-confidence is-${confidenceTone(
                                entry.confidence
                              )}`}
                            >
                              {entry.confidence}%
                            </span>
                            <ArrowRight className="validate-bento__research-row-arrow h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === 'naming' && (
            <TransitionStage
              key="naming"
              structured={displayStructured}
              researchEntries={researchEntries as any}
              defaultVentureName={displayTitle}
              onCreateVenture={handleCreateVenture}
              onCreateError={handleCreateError}
              externalError={createError}
              onEnterVenture={handleEnterVenture}
            />
          )}

          {phase === 'created' && journey.createdVentureId && (
            <TransitionStage
              key="created"
              structured={displayStructured}
              researchEntries={researchEntries as any}
              defaultVentureName={displayTitle}
              createdVentureId={journey.createdVentureId}
              onCreateVenture={handleCreateVenture}
              onEnterVenture={handleEnterVenture}
            />
          )}

          {phase === 'killed' && (
            <motion.div
              key="killed"
              layoutId="graduation-surface"
              className="grad-morph__killed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grad-morph__killed-icon">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="grad-morph__killed-body">
                <p className="grad-morph__killed-label">Decision recorded</p>
                <p className="grad-morph__killed-copy">
                  This idea was killed at validation. The evidence behind the
                  decision is preserved, and nothing more is invested here.
                </p>
                <div className="grad-morph__killed-actions">
                  <button
                    type="button"
                    className="grad-morph__killed-btn"
                    onClick={() => navigate('/ideas')}
                  >
                    Back to ideas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isDecided && (
          <ResearchMorePicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onSubmit={(input) => runResearch(input)}
          />
        )}

      <DocumentViewerDrawer
        document={
          activeReport
            ? ({
                id: activeReport.id,
                title: activeReport.title,
                summary: activeReport.summary,
                kind: 'research_report',
                ventureId: journey.ideaId,
                status: 'approved',
                content: '',
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
          {/* Pro tier venture gate — 1 active venture at a time. */}
      {gateState !== 'none' && (
        <VentureCountGate
          open={ventureGateOpen}
          onClose={() => setVentureGateOpen(false)}
          gateState={gateState}
          currentVentureName={activeVentureName}
          currentVentureId={activeVentureIdForArchive}
          onArchiveAndSave={handleArchiveAndSave}
          onUpgrade={onUpgrade}
        />
      )}

</div>

  );
}
