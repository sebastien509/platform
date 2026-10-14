import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IdeaJourney } from '@/lib/types';
import { usePushIdea } from '@/lib/hooks/useIdeas';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { isLocalIdeaId } from '@/features/ideas/localIdea';
import { deriveIdeaTitle } from '@/features/ideas/deriveIdeaTitle';

/* ============================================================
   useIdeaPush — the one-time push at graduation.

   Fires once when all three hold:
     · idea id is local
     · Synthesize is complete
     · no serverId yet

   On success: sets serverId on the journey, then navigates
   (replace) to /ideas/{serverId} so the URL is the DB id.
   ============================================================ */

export function useIdeaPush(
  ideaId: string | undefined,
  journey: IdeaJourney | undefined
) {
  const push = usePushIdea();
  const navigate = useNavigate();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ideaId || !journey) return;
    if (!isLocalIdeaId(ideaId)) return;
    if (journey.stageStates.synthesize !== 'complete') return;
    if ((journey as any).serverId) return;
    if (firedRef.current === ideaId) return;

    firedRef.current = ideaId;

    /* Prefer the LLM's finalized title; fall back to deriving. */
    const derivedTitle =
      journey.finalized?.title ??
      deriveIdeaTitle(journey.structured, journey.rawCapture);

    const finalOverview =
      journey.finalized?.overview ?? journey.synthesisOverview ?? null;

    /* Bundle research + synthesis state into the structured blob
     * so it survives the DB round-trip. */
    const structuredWithResearch = {
      ...(journey.structured as unknown as Record<string, unknown>),
      researchEntries: journey.researchEntries ?? [],
      researchRun: journey.researchRun ?? null,
      synthesisProposals: journey.synthesisProposals ?? [],
      synthesisOverview: journey.synthesisOverview ?? null,
      reviewNotes: journey.reviewNotes ?? {},
      /* The LLM's brief lives here — no DB column needed. */
      overview: finalOverview,
    };

    /* Debug — verify the finalize output is in scope at push time. */
    console.log('[idea push]', {
      hasFinalized: !!journey.finalized,
      finalizedTitle: journey.finalized?.title,
      finalizedOverviewLen: journey.finalized?.overview?.length ?? 0,
      synthesisOverviewLen: journey.synthesisOverview?.length ?? 0,
      writingTitle: derivedTitle,
      writingOverviewLen: finalOverview?.length ?? 0,
    });


    push
      .mutateAsync({
        title: derivedTitle,
        structured: structuredWithResearch,
        capture_payload: {
          exchanges: journey.capture?.exchanges ?? [],
          rawCapture: journey.rawCapture ?? '',
        },
        clean_payload: {
          fields: journey.clean?.fields ?? {},
        },
        validation: {
          decision: journey.validation?.decision ?? null,
          note: journey.validation?.note ?? null,
          decidedAt: journey.validation?.decidedAt ?? null,
            createdVentureId: journey.createdVentureId ?? null,
        },
      })
      .then((created) => {
        useJourneyStore.setState((s) => {
          const j = s.journeys[ideaId];
          if (!j) return s;
          return {
            journeys: {
              ...s.journeys,
              [ideaId]: { ...j, serverId: created.id } as any,
              /* The UUID copy must carry its own ideaId so
                 `commit()` inside IdeaJourney writes to the
                 correct store key after the URL flips. */
              [created.id]: {
                ...j,
                ideaId: created.id,
                serverId: created.id,
              } as any,
            },
            ideas: s.ideas.map((i) =>
              i.id === ideaId ? { ...i, title: derivedTitle } : i
            ),
          };
        });
        navigate(`/ideas/${created.id}`, { replace: true });
      })
      .catch((e) => {
        console.error('[idea push] failed', e);
        firedRef.current = null;
      });
  }, [ideaId, journey, push, navigate]);
}