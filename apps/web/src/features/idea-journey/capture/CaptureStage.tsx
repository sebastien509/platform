import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  IdeaStage,
  IdeaProcessing,
  IdeaInput,
  IdeaSubtitle,
} from '../primitives';
import { getIdeaAgent } from '../agent';
import { IdeaAgentError } from '../agent/types';
import type { CaptureExchange, CaptureState, CaptureSignal } from '@/lib/types';

interface CaptureStageProps {
  initialState: CaptureState;
  isRevisit?: boolean;
  onComplete: (state: CaptureState) => void;
  onChange?: (state: CaptureState) => void;
  onAdvance?: () => void;
}

const MAX_FOLLOW_UPS = 5;

export function CaptureStage({
  initialState,
  isRevisit = false,
  onComplete,
  onChange,
  onAdvance,
}: CaptureStageProps) {
  const [state, setState] = useState<CaptureState>(initialState);
  const [processing, setProcessing] = useState(false);
  const [revisitStep, setRevisitStep] = useState(0);

  /* Live question state — set by the agent, not derived from a bank. */
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentTargets, setCurrentTargets] = useState<CaptureSignal[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const isEditMode = isRevisit && state.exchanges.length > 0;
  const totalSteps = state.exchanges.length;
  const isRevisitComplete = isEditMode && revisitStep >= totalSteps;
  const currentStepIndex = isEditMode
    ? Math.min(revisitStep, totalSteps - 1)
    : -1;

  /* ---------- Bootstrap: fetch opening question ---------- */
  useEffect(() => {
    // Skip: edit mode, existing exchanges, or already-loaded question.
    if (isEditMode) return;
    if (state.exchanges.length > 0) return;

    let cancelled = false;
    setProcessing(true);
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const out = await getIdeaAgent().captureNext({
          rawCapture: '',
          exchanges: [],
          covered: [],
          followUpsRemaining: MAX_FOLLOW_UPS,
          signal: controller.signal,
        });
        if (cancelled) return;
        setCurrentQuestion(out.question ?? null);
        setCurrentTargets(out.targets);
        setCurrentLabel(out.confirmedLabel);
        setProcessing(false);
      } catch (e) {
        if (cancelled) return;
        setProcessing(false);
        setError(
          e instanceof IdeaAgentError
            ? e.message
            : 'Could not reach the agent'
        );
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Cleanup on unmount ---------- */
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  /* ---------- Answer handler ---------- */
  const handleAnswer = useCallback(
    (value: string) => {
      /* --- Edit mode: no agent, replay existing --- */
      if (isEditMode) {
        if (isRevisitComplete) return;
        const targets = state.exchanges[currentStepIndex].targets ?? [];
        const newExchanges = state.exchanges.map((ex, i) =>
          i === currentStepIndex
            ? { ...ex, founderAnswer: value, targets }
            : ex
        );
        const covered = Array.from(
          new Set(newExchanges.flatMap((e) => e.targets ?? []))
        );
        const complete = covered.length >= 5;
        const nextState: CaptureState = {
          ...state,
          exchanges: newExchanges,
          covered,
          complete,
        };
        setState(nextState);
        onChange?.(nextState);
        setRevisitStep((s) => s + 1);
        return;
      }

      /* --- Fresh flow: call the agent --- */
      setProcessing(true);
      setError(null);

      const question = currentQuestion ?? '';
      const placeholder: CaptureExchange = {
        id: `ex_${state.exchanges.length}`,
        agentQuestion: question,
        founderAnswer: value,
        targets: currentTargets,
        confirmedLabel: currentLabel,
      };
      const nextExchanges = [...state.exchanges, placeholder];

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const out = await getIdeaAgent().captureNext({
            rawCapture: nextExchanges
              .map((e) => e.founderAnswer ?? '')
              .join('\n\n'),
            exchanges: nextExchanges,
            covered: state.covered,
            followUpsRemaining: Math.max(
              0,
              MAX_FOLLOW_UPS - nextExchanges.length + 1
            ),
            signal: controller.signal,
          });

          /* Agent decides what the new answer covered, and next question. */
          const agentTargets = out.targets;
          const finalExchanges = nextExchanges.map((ex, i) =>
            i === nextExchanges.length - 1
              ? { ...ex, targets: agentTargets }
              : ex
          );
          const covered = Array.from(
            new Set([...state.covered, ...agentTargets])
          );

          const nextState: CaptureState = {
            ...state,
            exchanges: finalExchanges,
            covered,
            complete: out.complete,
          };
          setState(nextState);
          onChange?.(nextState);
          setProcessing(false);
          setCurrentQuestion(out.question ?? null);
          setCurrentTargets(out.targets);
          setCurrentLabel(out.confirmedLabel);

          if (out.complete) {
            setTimeout(() => onComplete(nextState), 500);
          }
        } catch (e) {
          setProcessing(false);
          setError(
            e instanceof IdeaAgentError
              ? e.message
              : 'Agent did not respond. Try again.'
          );
        }
      })();
    },
    [
      state,
      currentQuestion,
      currentTargets,
      currentLabel,
      isEditMode,
      isRevisitComplete,
      currentStepIndex,
      onChange,
      onComplete,
    ]
  );

  /* ---------- Processing ---------- */
  if (processing && !isEditMode) {
    return (
      <IdeaStage>
        <IdeaProcessing />
      </IdeaStage>
    );
  }

  /* ---------- Error ---------- */
  if (error && !isEditMode) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <p className="idea-focus__subtitle">
            {error}
          </p>
          <div className="idea-choices">
            <button
              type="button"
              className="idea-choice-btn is-primary"
              onClick={() => {
                setError(null);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </IdeaStage>
    );
  }

  /* ---------- Revisit-complete ---------- */
  if (isRevisitComplete) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <p className="idea-focus__subtitle">
            Your answers are saved.
          </p>
          <div className="idea-choices">
            <button
              type="button"
              className="idea-choice-btn"
              onClick={() => setRevisitStep(0)}
            >
              Review again
            </button>
            <button
              type="button"
              className="idea-choice-btn is-primary"
              onClick={() => onAdvance?.()}
            >
              Continue →
            </button>
          </div>
        </div>
      </IdeaStage>
    );
  }

  /* ---------- Question (fresh or revisit) ---------- */
  const displayQuestion = isEditMode
    ? isRevisitComplete
      ? null
      : state.exchanges[currentStepIndex]?.agentQuestion ?? null
    : currentQuestion;

  const initialInputValue = isEditMode
    ? isRevisitComplete
      ? ''
      : state.exchanges[currentStepIndex]?.founderAnswer ?? ''
    : '';

  return (
    <IdeaStage>
      <div className="idea-focus">
        {isEditMode && (
          <div
            className="clean-field-dots"
            role="tablist"
            aria-label={`Question ${revisitStep + 1} of ${totalSteps}`}
          >
            {state.exchanges.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === revisitStep}
                aria-label={`Question ${i + 1}`}
                title={`Question ${i + 1}`}
                onClick={() => setRevisitStep(i)}
                className={cn(
                  'clean-field-dots__dot',
                  i < revisitStep && 'is-locked',
                  i === revisitStep && 'is-active'
                )}
              />
            ))}
          </div>
        )}

        {isEditMode && (
          <p className="idea-focus__subtitle idea-focus__subtitle--edit">
            Editing answer {revisitStep + 1} of {totalSteps} — resubmit to save
          </p>
        )}

        {displayQuestion ? (
          <>
            <IdeaSubtitle key={displayQuestion} text={displayQuestion} />
            <IdeaInput
              id={`capture-input-${revisitStep}`}
              label="Your answer"
              placeholder="Type freely — one or two sentences is plenty…"
              agentColorVar="var(--agent-research)"
              initialValue={initialInputValue}
              onSubmit={handleAnswer}
            />
          </>
        ) : null}
      </div>
    </IdeaStage>
  );
}
