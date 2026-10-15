import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { IVLoadingScreen } from '@/features/loading';
import { IdeaJourney } from '@/features/idea-journey';
import { ideaRowToJourney } from '@/features/idea-journey/ideaRowToJourney';
import { ValidateBentoPage } from '@/features/idea-journey/validate/ValidateBentoPage';
import { isLocalIdeaId } from '@/features/ideas/localIdea';
import { useIdeaPush } from '@/features/idea-journey/useIdeaPush';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { useIdea } from '@/lib/hooks/useIdeas';
import { useIdeaKnowledge } from '@/features/idea-journey/useIdeaKnowledge';
import { finalizeAndPersist } from '@/features/idea-journey/finalizeAndPersist';

import { Search } from 'lucide-react';

const RAIL_STAGES = ['capture', 'clean', 'research', 'synthesize'] as const;

export default function IdeaDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const ideaId = params.ideaId as string;

  const isLocal = isLocalIdeaId(ideaId);

  const { data: dbIdea, isLoading: ideaLoading } = useIdea(
    isLocal ? undefined : ideaId
  );

  /* Research memos live in knowledge_entries, keyed by idea_id.
   * The DB is authoritative for research — the local store only
   * holds in-flight run state. */
  const { data: dbResearchEntries } = useIdeaKnowledge(
    isLocal ? undefined : ideaId,
  );

  const journey = useJourneyStore((s) =>
    ideaId ? s.journeys[ideaId] : undefined
  );
  const localIdea = useJourneyStore((s) =>
    ideaId ? s.ideas.find((i) => i.id === ideaId) : undefined
  );
  const ensureJourney = useJourneyStore((s) => s.ensureJourney);
  const setJourney = useJourneyStore((s) => s.setJourney);

  useEffect(() => {
    if (!ideaId) return;
    if (isLocal) {
      ensureJourney(ideaId);
    } else if (dbIdea) {
      ensureJourney(ideaId);
    }
  }, [ideaId, isLocal, dbIdea, ensureJourney]);

  /* ── Hydrate the local journey from the DB ──
   * On fresh page load the local store is empty (or stale). The DB
   * row is authoritative for stage + payloads. We hydrate once per
   * mount when the local stage doesn't match the DB stage. */
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (isLocal || !dbIdea) return;
    if (!journey) return;

    /* Match? Nothing to hydrate — local state is already in sync. */
    const localStage =
      journey.currentStage === 'transition' ? 'transition' : journey.currentStage;
    const dbStage =
      dbIdea.stage === 'transitioned' ? 'transition' : dbIdea.stage;

    if (localStage === dbStage) {
      hydratedRef.current = true;
      return;
    }

    /* DB is authoritative — hydrate the entire journey. */
    hydratedRef.current = true;
    const hydrated = ideaRowToJourney(dbIdea);
    setJourney(ideaId, hydrated);
  }, [ideaId, isLocal, dbIdea, journey, setJourney]);

  /**
   * Local ideas that haven't graduated from Synthesize are discardable
   * if the founder leaves. We guard against tab close + refresh with
   * the browser's native prompt. In-app navigation guarding ships next
   * as a small shell-level modal.
   */
  const shouldGuard =
    isLocal &&
    journey != null &&
    journey.stageStates.synthesize !== 'complete';

  useEffect(() => {
    if (!shouldGuard) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldGuard]);

  // Fire the one-time push when Synthesize is complete and the idea is local.
  useIdeaPush(ideaId, journey);

  if (!isLocal && ideaLoading) return <IVLoadingScreen />;

  if (isLocal ? !localIdea : !dbIdea) {
    return (
      <PageContainer>
        <EmptyState
          title="Idea not found"
          description="The idea you're looking for doesn't exist."
          icon={<Search className="h-6 w-6" />}
          action={
            <Button variant="outline" onClick={() => navigate('/ideas')}>
              Back to ideas
            </Button>
          }
        />
      </PageContainer>
    );
  }
  if (!journey) return <IVLoadingScreen />;

  /* ── Merge DB research into the local journey ──
   * Idempotent: dedupe by id every time. Safe against re-runs
   * and against concurrent mounts. */
  if (!isLocal && dbResearchEntries && dbResearchEntries.length > 0) {
    queueMicrotask(() => {
      const current = useJourneyStore.getState().journeys[ideaId];
      if (!current) return;

      const byId = new Map<string, any>();
      for (const e of current.researchEntries ?? []) byId.set(e.id, e);
      /* DB rows win — they're authoritative */
      for (const e of dbResearchEntries) byId.set(e.id, e);

      const merged = Array.from(byId.values());
      const prevIds = (current.researchEntries ?? []).map((e) => e.id).sort();
      const nextIds = merged.map((e) => e.id).sort();

      /* Skip if nothing changed — prevents infinite loops. */
      if (
        prevIds.length === nextIds.length &&
        prevIds.every((id, i) => id === nextIds[i])
      ) {
        return;
      }

      useJourneyStore.getState().setJourney(ideaId, {
        ...current,
        researchEntries: merged,
        updatedAt: new Date().toISOString(),
      });
    });
  }
  /* ── Routing: DB stage is authoritative ──
   * The local journey store holds in-progress work but may be
   * behind the DB (fresh page load → blank store → 'capture').
   * For the branch decision we trust the DB stage when we have
   * a DB idea, falling back to the local journey only for local
   * (un-synced) ideas.
   */
  const dbStage = !isLocal && dbIdea ? (dbIdea as any).stage : null;
  const localStage = journey.currentStage;

  /* Prefer whichever is further along so a migrated local journey
   * (still at 'synthesize') doesn't fight the DB (already 'validate'). */
  const STAGE_ORDER_LOCAL = [
    'capture',
    'clean',
    'research',
    'synthesize',
    'validate',
    'transition',
  ];
  const localIdx = STAGE_ORDER_LOCAL.indexOf(
    localStage === 'transition' ? 'transition' : localStage,
  );
  const dbIdx = dbStage
    ? STAGE_ORDER_LOCAL.indexOf(
        dbStage === 'transitioned' ? 'transition' : dbStage,
      )
    : -1;
  const effectiveStage = localIdx >= dbIdx ? localStage : dbStage;

  const isPostSynthesis = !RAIL_STAGES.includes(
    effectiveStage as (typeof RAIL_STAGES)[number],
  );

  /* ── Post-validation routing ──
   * Once an idea has graduated (venture created), send them to the
   * venture. Killed ideas still render the Validate page — it holds
   * the killed UI. */
  const transitionedToVenture =
    Boolean(journey.createdVentureId) ||
    effectiveStage === 'transitioned';

  if (transitionedToVenture && journey.createdVentureId) {
    return <Navigate to={`/ventures/${journey.createdVentureId}`} replace />;
  }

  /* Killed ideas also render the Validate page. */
  if (isPostSynthesis || effectiveStage === 'killed') {
    return (
      <ValidateBentoPage
        journey={journey}
        onChange={(next) => setJourney(ideaId, next)}
      />
    );
  }

  return (
    <IdeaJourney
      journey={journey}
      onChange={(next) => setJourney(ideaId, next)}
      onValidate={async () => {
        try {
          /* SynthesisStage already ran finalize — reuse its output
           * so we don't hit OpenAI twice. */
          const newIdeaId = await finalizeAndPersist(
            journey,
            journey.finalized ?? null,
          );
          navigate(`/ideas/${newIdeaId}`, { replace: true });
        } catch (e) {
          console.error('[IdeaDetail] finalizeAndPersist failed', e);
        }
      }}
    />
  );
}
