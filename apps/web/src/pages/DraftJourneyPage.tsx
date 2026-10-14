import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IVLoadingScreen } from '@/features/loading';
import { IdeaJourney } from '@/features/idea-journey';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { savePendingHandoff } from '@/features/onboarding/handoff';
import { fetchHandoff, type HandoffPreview } from '@/features/onboarding/draftHandoff';

/**
 * DraftJourneyPage — runs the Idea Journey for an unauthenticated
 * founder who arrived from the landing page with a handoff.
 *
 * Flow:
 *   /draft/hd_xxx
 *     ↓ (fetch handoff content)
 *     ↓ (seed local journey)
 *     IdeaJourney runs: capture → clean → research → synthesize
 *     ↓
 *     At synthesize-complete → auth gate
 */
export default function DraftJourneyPage() {
  const { handoffId } = useParams<{ handoffId: string }>();
  const navigate = useNavigate();
  const [handoff, setHandoff] = useState<HandoffPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const journey = useJourneyStore((s) =>
    handoffId ? s.journeys[handoffId] : undefined,
  );
  const ensureJourney = useJourneyStore((s) => s.ensureJourney);
  const setJourney = useJourneyStore((s) => s.setJourney);

  /* Load handoff + seed the local journey */
  useEffect(() => {
    if (!handoffId) return;
    let cancelled = false;

    async function load() {
      try {
        const preview = await fetchHandoff(handoffId!);
        if (cancelled) return;

        if (preview.status !== 'pending') {
          setError(
            preview.status === 'claimed'
              ? 'This idea has already been claimed. Sign in to continue.'
              : 'This idea handoff has expired. Start a new one from the landing page.',
          );
          setLoading(false);
          return;
        }

        setHandoff(preview);

        /* Persist the handoff ID for the auth flow */
        savePendingHandoff(handoffId!);

        /* Ensure a journey exists in the local store */
        const existing = ensureJourney(handoffId!);

        /* Seed the founder's raw input into the journey.
         * `rawCapture` is the canonical field — the capture stage
         * reads from it directly and uses it to drive the
         * clean stage's field extraction. */
        const hasRawInput = Boolean(existing.rawCapture?.trim());

        if (!hasRawInput && preview.content) {
          setJourney(handoffId!, {
            ...existing,
            rawCapture: preview.content,
            updatedAt: new Date().toISOString(),
          });
        }

        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load idea.');
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [handoffId, ensureJourney, setJourney]);

  if (loading) return <IVLoadingScreen />;

  if (error || !handoff) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <span className="onboarding-icon is-error">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h1 className="onboarding-title">This idea isn't available</h1>
          <p className="onboarding-sub">{error ?? 'Handoff not found.'}</p>
          <div className="onboarding-actions">
            <Button onClick={() => navigate('/login', { replace: true })}>
              Sign in instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!journey) return <IVLoadingScreen />;

  /* ── Auth gate ──
   * Once the founder reaches synthesize-complete, we've delivered
   * the value. Now ask for signup — the idea stays in localStorage
   * until they claim it. */
  /* Gate at RESEARCH-complete. The draft journey stops here —
   * synthesize belongs to the authenticated side so finalize runs
   * with a session and the founder sees the bridge screen before
   * validate. */
  const researchComplete =
    journey.stageStates.research === 'complete';

  if (researchComplete) {
    const next = `/onboarding?handoff=${handoffId}`;
    const loginUrl = `/login?next=${encodeURIComponent(next)}`;

    return (
      <div className="onboarding-page">
        <div className="onboarding-card is-wide">
          <span className="onboarding-icon">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="onboarding-title">Your idea is ready</h1>
          <p className="onboarding-sub">
            We've captured the problem, the market, and the wedge. Sign in
            to save it to your workspace and validate it.
          </p>
          <div className="onboarding-actions">
            <Button
              size="lg"
              onClick={() => navigate(loginUrl, { replace: true })}
              className="gap-2"
            >
              Save & validate
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="onboarding-fineprint">
            Your work is saved in this browser. Nothing leaves until you sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <IdeaJourney
      journey={journey}
      onChange={(next) => setJourney(handoffId!, next)}
      draftMode
    />
  );
}
