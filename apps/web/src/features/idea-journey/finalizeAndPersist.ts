import { getIdeaAgent } from './agent';
import { pushIdeaToDb } from '@/lib/hooks/pushIdeaToDb';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import type { IdeaJourney } from '@/lib/types';

/**
 * finalizeAndPersist — the ONE write path for a completed journey.
 *
 * Runs finalize (authenticated), builds the full record from the
 * local journey, INSERTs a single row at stage='validate', then
 * migrates the local journey to the new UUID.
 *
 * Called from:
 *   · Onboarding.tsx — handoff flow, after wizard completes
 *   · IdeaJourney.onValidate — normal flow, "Review and decide"
 *
 * Returns the DB idea id.
 */
export async function finalizeAndPersist(
  journey: IdeaJourney,
  /** When provided, skip the LLM call and use this data. Set by
   *  SynthesisStage which has already run finalize and produced
   *  the same blob the founder saw on the bridge screen. */
  alreadyFinalized?: {
    title?: string;
    overview?: string;
    structured?: any;
  } | null,
): Promise<string> {
  let finalized: {
    title?: string;
    overview?: string;
    structured?: any;
  } | null = alreadyFinalized ?? null;

  if (!finalized) {
    try {
      finalized = await getIdeaAgent().finalize({
        structured: journey.structured,
        synthesisOverview: journey.synthesisOverview,
        research: journey.researchEntries ?? [],
        rawCapture: journey.rawCapture,
      });
    } catch (e) {
      console.warn('[finalizeAndPersist] finalize failed, using local state', e);
    }
  }

  const fallbackTitle =
    journey.rawCapture?.slice(0, 60) ||
    journey.structured.problem?.value?.slice(0, 60) ||
    'New idea';

  const finalStructured = finalized?.structured ?? journey.structured;
  const finalOverview =
    finalized?.overview ?? journey.synthesisOverview ?? null;

  /* 2. Build the full record — everything the founder produced. */
  const structuredWithResearch = {
    ...(finalStructured as unknown as Record<string, unknown>),
    researchEntries: journey.researchEntries ?? [],
    researchRun: journey.researchRun ?? null,
    synthesisProposals: journey.synthesisProposals ?? [],
    synthesisOverview: journey.synthesisOverview ?? null,
    reviewNotes: (journey as any).reviewNotes ?? {},
    overview: finalOverview,
  };

  /* 3. Single INSERT. */
  const created = await pushIdeaToDb({
    title: finalized?.title ?? fallbackTitle,
    structured: structuredWithResearch,
    capture_payload: {
      exchanges: journey.capture?.exchanges ?? [],
      rawCapture: journey.rawCapture ?? '',
    },
    clean_payload: {
      fields: journey.clean?.fields ?? {},
    },
    validation: {
      decision: null,
      note: null,
      decidedAt: null,
      createdVentureId: null,
    },
    stage: 'validate',
  });

  /* 4. Migrate the local journey to the new UUID key. */
  useJourneyStore.getState().setJourney(created.id, {
    ...journey,
    ideaId: created.id,
    serverId: created.id,
  } as any);

  /* Also attach the finalized blob to the migrated journey so
   * ValidateBentoPage reads it directly. */
  useJourneyStore.setState((s) => {
    const migrated = s.journeys[created.id];
    if (!migrated) return s;
    return {
      journeys: {
        ...s.journeys,
        [created.id]: {
          ...migrated,
          finalized: finalized
            ? {
                title: finalized.title ?? fallbackTitle,
                overview: finalized.overview ?? '',
                structured: finalStructured,
                finalizedAt: new Date().toISOString(),
              }
            : undefined,
        } as any,
      },
    };
  });

  return created.id;
}
