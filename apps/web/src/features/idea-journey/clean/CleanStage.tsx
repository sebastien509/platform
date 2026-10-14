import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IdeaStage,
  IdeaProcessing,
  IdeaInput,
  IdeaChoices,
} from '../primitives';
import { affectedDownstreamFields } from './fieldDependencies';
import { getIdeaAgent } from '../agent';
import { IdeaAgentError } from '../agent/types';
import { cn } from '@/lib/utils/cn';
import type {
  CleanFieldKey,
  CleanFieldState,
  CleanState,
  StructuredIdeaCard,
} from '@/lib/types';

interface CleanStageProps {
  initialState: CleanState;
  isRevisit?: boolean;
  rawCapture: string;
  structured?: StructuredIdeaCard;
  onComplete: (state: CleanState) => void;
  onChange?: (state: CleanState) => void;
  onAdvance?: () => void;
}

type Mode = 'ask' | 'confirm' | 'downstream';

const EMPTY_STRUCTURED: StructuredIdeaCard = {
  problem: null,
  persona: null,
  value: null,
  sector: null,
};

export function CleanStage({
  initialState,
  isRevisit = false,
  rawCapture,
  structured,
  onComplete,
  onChange,
  onAdvance,
}: CleanStageProps) {
  const [state, setState] = useState<CleanState>(initialState);
  const [mode, setMode] = useState<Mode>('ask');
  const [candidate, setCandidate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [revisitingKey, setRevisitingKey] = useState<CleanFieldKey | null>(null);
  const [affectedKeys, setAffectedKeys] = useState<CleanFieldKey[]>([]);

  /* Agent-driven prompt state */
  const [agentQuestion, setAgentQuestion] = useState<string | null>(null);
  const [agentLockedValue, setAgentLockedValue] = useState<string | undefined>(
    undefined
  );
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const lastFetchedKey = useRef<string | null>(null);

  /* Mount-time activation. */
  useEffect(() => {
    if (state.activeFieldKey) return;

    const firstOpen = state.order.find(
      (k) => state.fields[k].status !== 'locked'
    );
    const target = firstOpen ?? (isRevisit ? state.order[0] : null);
    if (!target) return;

    const targetField = state.fields[target];
    const isLockedTarget = targetField.status === 'locked';

    setState((s) => ({
      ...s,
      activeFieldKey: target,
      fields: isLockedTarget
        ? s.fields
        : {
            ...s.fields,
            [target]: { ...s.fields[target], status: 'active' },
          },
    }));

    if (isLockedTarget) {
      setRevisitingKey(target);
      setCandidate(targetField.value ?? '');
      setMode('confirm');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeField = state.activeFieldKey
    ? state.fields[state.activeFieldKey]
    : null;

  const fields = useMemo(
    () => state.order.map((k) => state.fields[k]),
    [state]
  );
  const lockedCount = fields.filter((f) => f.status === 'locked').length;

  const isRevisiting =
    revisitingKey !== null && activeField?.key === revisitingKey;

  const initialInputValue =
    isRevisiting && mode === 'ask' ? activeField?.value ?? '' : '';

  /* -----------------------------------------------------------------
     Agent call — one per (field, mode, exchanges-length, candidate)
     combination. Cache key prevents duplicate calls.
     ----------------------------------------------------------------- */
  useEffect(() => {
    if (!activeField) return;
    if (mode === 'downstream') return;

    const cacheKey = JSON.stringify({
      f: activeField.key,
      m: mode,
      e: activeField.exchanges.length,
      c: mode === 'confirm' ? candidate : null,
    });
    if (lastFetchedKey.current === cacheKey) return;

    let cancelled = false;
    setAgentLoading(true);
    setAgentError(null);

    (async () => {
      try {
        const out = await getIdeaAgent().cleanNext({
          fieldKey: activeField.key,
          exchanges: activeField.exchanges,
          rawCapture,
          currentValue: mode === 'confirm' ? candidate : activeField.value,
          structured: structured ?? EMPTY_STRUCTURED,
        });
        if (cancelled) return;
        /* Cache only after success — StrictMode cancels the first
           invocation before it resolves, and we need the second
           invocation to actually fire and complete. */
        lastFetchedKey.current = cacheKey;
        setAgentQuestion(out.question);
        setAgentLockedValue(out.lockedValue);
        setAgentLoading(false);

        /* The agent's question already IS the confirmation. When
         * it returns a locked value in confirm mode, commit it
         * immediately. The founder's typed answer was the input;
         * the agent's locked value is the output.
         *
         * The founder sees what got locked in the rail dots (they
         * can click any locked dot to revisit). No redundant
         * "That's right" button. */
        if (mode === 'confirm' && out.lockedValue) {
          commitField(out.lockedValue);
        }

        /* If the agent returned a locked value AND we're in
         * confirm mode AND the founder hasn't started editing a
         * candidate — commit immediately. The agent's question
         * already IS the confirmation. */
        if (
          mode === 'confirm' &&
          out.lockedValue &&
          !candidate
        ) {
          commitField(out.lockedValue);
        }
      } catch (e) {
        if (cancelled) return;
        setAgentLoading(false);
        setAgentError(
          e instanceof IdeaAgentError ? e.message : 'Agent did not respond'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeField, mode, candidate, rawCapture, structured]);

  const subtitle = useMemo(() => {
    if (!activeField) return null;
    if (mode === 'downstream') {
      const names = affectedKeys.map((k) => state.fields[k].label).join(' & ');
      return `Updated: "${candidate}". Locking this in — heads up, this changes ${names}. Want to glance back at those?`;
    }
    if (agentLoading) return null;
    if (agentError) return `Couldn't reach the agent. ${agentError}`;
    return agentQuestion;
  }, [
    activeField,
    mode,
    affectedKeys,
    state,
    candidate,
    agentLoading,
    agentError,
    agentQuestion,
  ]);

  function commitField(value: string) {
    if (!activeField) return;
    const updated: CleanFieldState = {
      ...activeField,
      status: 'locked',
      value,
    };
    const nextFields = { ...state.fields, [activeField.key]: updated };

    if (revisitingKey === activeField.key) {
      const affected = affectedDownstreamFields(
        activeField.key,
        nextFields,
        state.order
      );
      if (affected.length > 0) {
        setState((s) => ({ ...s, fields: nextFields }));
        setAffectedKeys(affected);
        setMode('downstream');
        return;
      }
      setRevisitingKey(null);
    }
    advanceAfterCommit(nextFields, activeField.key, updated);
  }

  function advanceAfterCommit(
    nextFields: typeof state.fields,
    committedKey: CleanFieldKey,
    _lockedField: CleanFieldState
  ) {
    const idx = state.order.indexOf(committedKey);
    const nextKey = state.order[idx + 1];

    if (nextKey) {
      if (!isRevisit) {
        nextFields[nextKey] = { ...nextFields[nextKey], status: 'active' };
      }

      const nextState: CleanState = {
        ...state,
        fields: nextFields,
        activeFieldKey: nextKey,
        complete: false,
      };

      setState(nextState);
      onChange?.(nextState);
      setAffectedKeys([]);
      setAgentQuestion(null);
      setAgentLockedValue(undefined);
      lastFetchedKey.current = null;

      const nextField = nextFields[nextKey];
      const nextIsLocked = nextField?.status === 'locked';

      if (isRevisit && nextIsLocked) {
        setMode('confirm');
        setCandidate(nextField.value ?? '');
        setRevisitingKey(nextKey);
      } else {
        setMode('ask');
        setCandidate('');
        setRevisitingKey(null);
      }
      return;
    }

    /* Last field committed */
    const nextState: CleanState = {
      ...state,
      fields: nextFields,
      activeFieldKey: null,
      complete: true,
    };

    setState(nextState);
    onChange?.(nextState);
    setMode('ask');
    setCandidate('');
    setRevisitingKey(null);
    setAffectedKeys([]);

    if (!isRevisit) {
      setTimeout(() => onComplete(nextState), 500);
    }
  }

  const handleFreeAnswer = useCallback(
    (value: string) => {
      if (!activeField) return;
      setProcessing(true);
      setTimeout(() => {
        const merged = candidate ? `${candidate} ${value}`.trim() : value;
        setCandidate(merged);
        setState((s) => ({
          ...s,
          fields: {
            ...s.fields,
            [activeField.key]: {
              ...s.fields[activeField.key],
              exchanges: [
                ...s.fields[activeField.key].exchanges,
                {
                  id: `${activeField.key}-${s.fields[activeField.key].exchanges.length}`,
                  agentQuestion: agentQuestion ?? '',
                  founderAnswer: value,
                  move: 'reflect',
                },
              ],
            },
          },
        }));
        setProcessing(false);
        setMode('confirm');
      }, 250);
    },
    [activeField, candidate, agentQuestion]
  );

  function handleRevisitField(key: CleanFieldKey) {
    const field = state.fields[key];
    if (field.status === 'pending') return;
    setState({ ...state, activeFieldKey: key });
    setRevisitingKey(field.status === 'locked' ? key : null);
    setCandidate(field.value ?? '');
    setMode(field.status === 'locked' ? 'confirm' : 'ask');
    setAgentQuestion(null);
    setAgentLockedValue(undefined);
    lastFetchedKey.current = null;
  }

  function handleChoice(value: string) {
    if (value === 'confirm') {
      /* Prefer the agent's sharpened value if the call succeeded. */
      commitField(agentLockedValue ?? candidate);
      return;
    }
    if (value === 'more') {
      setMode('ask');
      setAgentQuestion(null);
      setAgentLockedValue(undefined);
      lastFetchedKey.current = null;
      return;
    }
    if (value === 'review') {
      if (!activeField) return;
      const nextFields = { ...state.fields };
      nextFields[activeField.key] = {
        ...nextFields[activeField.key],
        status: 'locked',
        value: candidate,
      };
      affectedKeys.forEach((key) => {
        nextFields[key] = {
          ...nextFields[key],
          status: 'active',
          value: undefined,
        };
      });
      const nextState: CleanState = {
        ...state,
        fields: nextFields,
        activeFieldKey: affectedKeys[0],
        complete: false,
      };
      setState(nextState);
      onChange?.(nextState);
      setMode('ask');
      setCandidate('');
      setRevisitingKey(null);
      setAffectedKeys([]);
      setAgentQuestion(null);
      setAgentLockedValue(undefined);
      lastFetchedKey.current = null;
      return;
    }
    if (value === 'leave') {
      if (!activeField) return;
      const nextFields = {
        ...state.fields,
        [activeField.key]: {
          ...activeField,
          status: 'locked' as const,
          value: candidate,
        },
      };
      advanceAfterCommit(
        nextFields,
        activeField.key,
        nextFields[activeField.key]
      );
    }
  }

  /* -----------------------------------------------------------------
     Render
     ----------------------------------------------------------------- */

  if (processing) {
    return (
      <IdeaStage>
        <IdeaProcessing />
      </IdeaStage>
    );
  }

  const isRevisitComplete =
    isRevisit && state.activeFieldKey === null && !processing;

  if (isRevisitComplete) {
    return (
      <IdeaStage>
        <div className="idea-focus">
          <p className="idea-focus__subtitle">Your answers are saved.</p>
          <div className="idea-choices">
            <button
              type="button"
              className="idea-choice-btn"
              onClick={() => {
                const first = state.order[0];
                setState((s) => ({
                  ...s,
                  activeFieldKey: first,
                  complete: false,
                }));
                setRevisitingKey(first);
                setCandidate(state.fields[first].value ?? '');
                setMode('confirm');
                setAgentQuestion(null);
                setAgentLockedValue(undefined);
                lastFetchedKey.current = null;
              }}
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

  /* Field activation loading — show the hex only when we have no
     prior question and the agent is still working. */
  const showBlockingLoader =
    activeField && agentLoading && !agentQuestion && mode !== 'downstream';

  if (showBlockingLoader) {
    return (
      <IdeaStage>
        <IdeaProcessing />
      </IdeaStage>
    );
  }

  return (
    <IdeaStage>
      {(!state.complete || isRevisit) && (
        <div
          className="clean-field-dots"
          role="tablist"
          aria-label={`${lockedCount} of ${state.order.length} fields locked`}
        >
          {state.order.map((key) => {
            const f = state.fields[key];
            const isPending = f.status === 'pending';
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={key === state.activeFieldKey}
                aria-label={f.label}
                title={f.label}
                disabled={isPending}
                onClick={() => handleRevisitField(key)}
                className={cn(
                  'clean-field-dots__dot',
                  f.status === 'locked' && 'is-locked',
                  key === state.activeFieldKey && 'is-active',
                  isPending && 'is-pending'
                )}
              />
            );
          })}
        </div>
      )}

      <div className="idea-focus">
        {activeField && subtitle ? (
          <>
            {isRevisiting && mode === 'confirm' && (
              <p className="idea-focus__subtitle idea-focus__subtitle--edit">
                Reviewing {activeField.label}
              </p>
            )}
            <p className="idea-focus__subtitle">{subtitle}</p>
            {mode === 'downstream' ? (
              <IdeaChoices
                choices={[
                  {
                    label: `Review ${affectedKeys
                      .map((k) => state.fields[k].label)
                      .join(' & ')}`,
                    value: 'review',
                    primary: true,
                  },
                  { label: 'Leave them as is', value: 'leave' },
                ]}
                onSelect={handleChoice}
              />
            ) : (
              <IdeaInput
                id={`clean-${activeField.key}`}
                label={`Your answer for ${activeField.label}`}
                placeholder="Type your answer…"
                agentColorVar="var(--agent-strategy)"
                initialValue={initialInputValue}
                onSubmit={handleFreeAnswer}
              />
            )}
          </>
        ) : null}
      </div>
    </IdeaStage>
  );
}
