import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, RefreshCw } from 'lucide-react';
import { IdeaStage, IdeaProcessing } from '../primitives';
import { getIdeaAgent } from '../agent';
import { IdeaAgentError } from '../agent/types';
import type { IdeaJourney, StructuredIdeaField } from '@/lib/types';

interface SynthesisStageProps {
  journey: IdeaJourney;
  onChange: (next: IdeaJourney) => void;
  acknowledgmentSatisfied: boolean;
  onGoToResearch?: () => void;
  onContinue?: () => void;
  onReviewAgain?: () => void;
}

const FIELDS: Array<{ key: 'problem' | 'persona' | 'value' | 'sector'; label: string }> = [
  { key: 'problem', label: 'Problem' },
  { key: 'persona', label: 'Persona' },
  { key: 'value', label: 'Value' },
  { key: 'sector', label: 'Sector' },
];

export function SynthesisStage({
  journey,
  onChange,
  acknowledgmentSatisfied,
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
    firedRef.current = true;
    void runFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acknowledgmentSatisfied, finalized]);

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

  function handleReviewAgain() {
    firedRef.current = false;
    onChange({ ...journey, finalized: undefined });
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

  return (
    <IdeaStage>
      <div className="synth-stage">
        <div className="synth-hero">
          <div className="synth-hero__eyebrow">
            <Check className="h-3 w-3" />
            Your idea card
          </div>
          <h2 className="synth-hero__title">{finalized.title}</h2>
          {finalized.overview && (
            <p className="synth-hero__brief">{finalized.overview}</p>
          )}
        </div>

        <div className="synth-outcomes">
          {FIELDS.map((f) => {
            const field = finalized.structured[f.key] as
              | StructuredIdeaField
              | null
              | undefined;
            return (
              <article key={f.key} className="synth-outcome">
                <span className="synth-outcome__label">{f.label}</span>
                <p className="synth-outcome__value">
                  {field?.value || '—'}
                </p>
              </article>
            );
          })}
        </div>

        <div className="synth-actions">
          <button
            type="button"
            className="synth-btn synth-btn--ghost"
            onClick={handleReviewAgain}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            className="synth-btn synth-btn--primary"
            onClick={onContinue}
          >
            Looks good — continue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </IdeaStage>
  );
}
