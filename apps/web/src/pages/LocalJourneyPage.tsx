import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IVLoadingScreen } from '@/features/loading';
import { IdeaJourney } from '@/features/idea-journey';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { finalizeAndPersist } from '@/features/idea-journey/finalizeAndPersist';

/**
 * LocalJourneyPage — the pure local draft journey.
 *
 * Route: /ideas/local/:localId
 *
 * · No DB queries. No membership check. The journey lives entirely
 *   in localStorage until the founder finishes synthesize.
 * · On validate, finalizeAndPersist runs (authenticated) — one
 *   INSERT at stage='validate' — then navigates to /ideas/:uuid.
 *
 * This is deliberately outside RequireOnboarding: a fresh signup
 * lands here before the workspace is fully settled.
 */
export default function LocalJourneyPage() {
  const { localId } = useParams<{ localId: string }>();
  const navigate = useNavigate();

  /* The store key keeps the `local_` prefix so isLocalIdeaId() works
   * wherever it's checked; the URL drops it for cleanliness. */
  const storeKey = localId ? `local_${localId}` : '';

  const journey = useJourneyStore((s) =>
    storeKey ? s.journeys[storeKey] : undefined,
  );
  const ensureJourney = useJourneyStore((s) => s.ensureJourney);
  const setJourney = useJourneyStore((s) => s.setJourney);

  useEffect(() => {
    if (storeKey) ensureJourney(storeKey);
  }, [storeKey, ensureJourney]);

  if (!journey) return <IVLoadingScreen />;

  return (
    <IdeaJourney
      journey={journey}
      onChange={(next) => setJourney(storeKey, next)}
      onValidate={async () => {
        try {
          /* Reuse the finalize output SynthesisStage already produced. */
          const newIdeaId = await finalizeAndPersist(
            journey,
            journey.finalized ?? null,
          );
          navigate(`/ideas/${newIdeaId}`, { replace: true });
        } catch (e) {
          console.error('[LocalJourney] finalizeAndPersist failed', e);
        }
      }}
    />
  );
}
