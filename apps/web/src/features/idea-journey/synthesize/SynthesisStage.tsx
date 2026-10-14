import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { IdeaStage, IdeaProcessing } from '../primitives';
import { getIdeaAgent } from '../agent';
import { IdeaAgentError } from '../agent/types';
import type { IdeaJourney } from '@/lib/types';

interface SynthesisStageProps {
  journey: IdeaJourney;
  onChange: (next: IdeaJourney) => void;
  acknowledgmentSatisfied: boolean;
  /** Draft mode — skip the finalize LLM call. The founder isn't
   *  authenticated yet, and finalize persists the record. The auth
   *  gate in DraftJourneyPage takes over from here. */
  draftMode?: boolean;
  onGoToResearch?: () => void;
  onContinue?: () => void;
  onReviewAgain?: () => void;
}

export function SynthesisStage({
  journey,
  onChange,
  acknowledgmentSatisfied,
  draftMode = false,
  onGoToResearch,
  onContinue,
}: SynthesisStageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firedRef = useRef(false);

  const research = journey.researchEntries ?? [];
  const finalized = journey.finalized;

  /* ============================================================
     Fire the finalize LLM once on mount.
     It produces: title (5-7w) + brief + all 4 refined fields.
     That output IS the record.
     ============================================================ */
  useEffect(() => {
    if (!acknowledgmentSatisfied) return;
    if (finalized) return;
    if (firedRef.current) return;

    /* Draft mode — synthesize marks complete, no LLM call. The
     * finalize step runs from /ideas/:id after sign-in, where the
     * founder is authenticated and the write is safe. */
    if (draftMode) {
      firedRef.current = true;
      onChange({
        ...journey,
        stageStates: { ...journey.stageStates, synthesize: 'complete' },
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    firedRef.current = true;
    void runFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acknowledgmentSatisfied, finalized, draftMode]);

  async function runFinalize() {
    setLoading(true);
    setError('');
    try {
      const out = await getIdeaAgent().finalize({
        structured: journey.structured,
        synthesisOverview: journey.synthesisOverview,
        research,
        rawCapture: journey.rawCapture,
      });
      onChange({
        ...journey,
        finalized: {
          title: out.title,
          overview: out.overview,
          structured: out.structured,
          finalizedAt: new Date().toISOString(),
        },
        structured: out.structured,
      });
    } catch (e) {
      /* No fallback. If the LLM fails, we don't finalize — the
       * founder retries. Writing founder inputs as the record
       * would silently ship something the LLM never produced. */
      console.error('[synthesize] finalize failed', e);
      setError(
        e instanceof IdeaAgentError
          ? `Couldn't finalize — ${e.message}`
          : "Couldn't finalize. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     Render
     ============================================================ */

  if (!acknowledgmentSatisfied) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <p className="idea-focus__subtitle">
            Research not yet reviewed. Acknowledge the reports to continue.
          </p>
          {onGoToResearch && (
            <div className="idea-choices">
              <button
                type="button"
                className="idea-choice-btn is-primary"
                onClick={onGoToResearch}
              >
                Go to Research
              </button>
            </div>
          )}
        </div>
      </IdeaStage>
    );
  }

  if (error && !finalized) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <p className="idea-focus__subtitle">{error}</p>
          <div className="idea-choices">
            <button
              type="button"
              className="idea-choice-btn is-primary"
              onClick={() => {
                setError('');
                firedRef.current = false;
                void runFinalize();
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </IdeaStage>
    );
  }

  if (loading || !finalized) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <IdeaProcessing />
          <p className="idea-focus__subtitle">
            Reading the research and sharpening your idea card…
          </p>
        </div>
      </IdeaStage>
    );
  }

  /* ── Bridge view ──
   * Synthesize exists to run finalize and hand off to validate.
   * The 4 cards are read once — in Validation. This screen shows
   * the outcome (title + brief) + a single decision button. No
   * duplicate field editing. */
  return (
    <IdeaStage>
      <div className="synth-stage">
        <div className="synth-hero">
          <div className="synth-hero__eyebrow">
            <Check className="h-3 w-3" />
            Synthesized
          </div>
          <h2 className="synth-hero__title">{finalized.title}</h2>
          {finalized.overview && (
            <p className="synth-hero__brief">{finalized.overview}</p>
          )}
        </div>

        <ul className="synth-signals">
          <li className="synth-signal">
            <Check className="h-3.5 w-3.5" />
            {research.length} research {research.length === 1 ? 'thread' : 'threads'} synthesized
          </li>
          <li className="synth-signal">
            <Check className="h-3.5 w-3.5" />
            Four fields refined
          </li>
          <li className="synth-signal">
            <Check className="h-3.5 w-3.5" />
            Ready to review and decide
          </li>
        </ul>

        <div className="synth-actions">
          <button
            type="button"
            className="synth-btn synth-btn--primary"
            onClick={onContinue}
          >
            Review and decide
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </IdeaStage>
  );
}
