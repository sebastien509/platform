import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JourneyProgress, IdeaHeader } from './primitives';
import { IdeaJourneyBackground } from './primitives/IdeaJourneyBackground';
import { CaptureStage } from './capture';
import { CleanStage } from './clean';
import { ResearchStage } from './research';
import { SynthesisStage } from './synthesize';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { deriveIdeaTitle } from '@/features/ideas/deriveIdeaTitle';
import { typeformEnter } from '@/lib/motion';
import type {
  IdeaJourney as IdeaJourneyType,
  IdeaStage,
  CleanState,
  WorkspacePlan,
} from '@/lib/types';

interface IdeaJourneyProps {
  journey: IdeaJourneyType;
  onChange: (next: IdeaJourneyType) => void;
  plan?: WorkspacePlan;
  onUpgrade?: () => void;
}

const STAGE_ORDER: IdeaStage[] = [
  'capture',
  'clean',
  'research',
  'synthesize',
  'validate',
  'transition',
];

const STAGE_TITLE: Record<IdeaStage, string> = {
  capture: 'Tell us about the idea',
  clean: "Let's sharpen this",
  research: 'Research is running',
  synthesize: 'Review what changed',
  validate: 'Decide',
  transition: 'Name the venture',
};

function buildAdvancedState(
  base: IdeaJourneyType,
  completed: IdeaStage,
  extra: Partial<IdeaJourneyType>
): IdeaJourneyType {
  const next = STAGE_ORDER[STAGE_ORDER.indexOf(completed) + 1];
  return {
    ...base,
    ...extra,
    currentStage: next,
    stageStates: {
      ...base.stageStates,
      [completed]: 'complete',
      [next]: 'active',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function IdeaJourney({ journey, onChange }: IdeaJourneyProps) {
  const currentStage = journey.currentStage;
  const previousStageRef = useRef<IdeaStage | null>(null);
  /* Track the CURRENT ideaId — memoized callbacks (handleJump,
     handleAdvanceFromRevisit) capture the first render's value.
     The ref keeps them writing to the right store key even after
     the URL flips from local_xxx to the DB UUID. */
  const ideaIdRef = useRef(journey.ideaId);
  useEffect(() => {
    ideaIdRef.current = journey.ideaId;
  }, [journey.ideaId]);

  /**
   * commit — always operate on the LATEST journey from the store.
   * The render-scope `journey` prop can be stale between async
   * thread completions, which was wiping structured card + research
   * when handlers fired.
   */
  function commit(fn: (latest: IdeaJourneyType) => IdeaJourneyType) {
    const id = ideaIdRef.current;
    const latest = useJourneyStore.getState().journeys[id];
    if (!latest) return;
    const next = fn(latest);
    useJourneyStore.getState().setJourney(id, next);

    /* Keep the local idea list title in sync with the structured
       card, so the list never shows "Untitled idea" once the
       founder has answered the first field. */
    const derived = deriveIdeaTitle(next.structured, next.rawCapture);
    if (derived && derived !== 'New idea') {
      useJourneyStore.setState((s) => ({
        ideas: s.ideas.map((i) =>
          i.id === id ? { ...i, title: derived } : i
        ),
      }));
    }
  }

  const isRevisitCapture = journey.stageStates.capture === 'complete';
  const isRevisitClean = journey.stageStates.clean === 'complete';

  const handleJump = useCallback((stage: IdeaStage) => {
    commit((latest) => {
      if (stage !== latest.currentStage) {
        previousStageRef.current = latest.currentStage;
      }
      return {
        ...latest,
        currentStage: stage,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const handleAdvanceFromRevisit = useCallback(() => {
    commit((latest) => {
      const target = previousStageRef.current ?? 'clean';
      previousStageRef.current = null;
      return {
        ...latest,
        currentStage: target,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  function handleCaptureComplete(captureState: {
    exchanges: any[];
    covered: any[];
    followUpsRemaining: number;
    complete: boolean;
  }) {
    commit((latest) => {
      const cleanNext: CleanState = {
        ...latest.clean,
        fields: {
          ...latest.clean.fields,
          problem: { ...latest.clean.fields.problem, status: 'active' },
        },
        activeFieldKey: 'problem',
      };
      return buildAdvancedState(latest, 'capture', {
        capture: captureState as any,
        rawCapture: captureState.exchanges
          .map((e: any) => e.founderAnswer)
          .filter(Boolean)
          .join('\n\n'),
        clean: cleanNext,
      });
    });
  }

  function handleCleanComplete(cleanState: CleanState) {
    commit((latest) => {
      /* Promote every Clean-locked field into `structured`.
       * Without this step, `structured` stays empty until a
       * synthesis proposal accepts a value — and rejected
       * proposals leave the field null all the way to the DB. */
      const nextStructured = { ...latest.structured };
      const KEYS = ['problem', 'persona', 'value', 'sector'] as const;

      for (const key of KEYS) {
        const cleanField = cleanState.fields?.[key];
        if (cleanField?.value) {
          nextStructured[key] = {
            id: nextStructured[key]?.id ?? key,
            key,
            label: cleanField.label ?? key.charAt(0).toUpperCase() + key.slice(1),
            value: cleanField.value,
            /* Clean doesn't produce a headline or metrics — leave
             * whatever the agent added earlier if it exists. */
            headline: nextStructured[key]?.headline,
            metrics: nextStructured[key]?.metrics,
            status: 'confirmed',
          };
        }
      }

      return buildAdvancedState(latest, 'clean', {
        clean: cleanState,
        structured: nextStructured,
      });
    });
  }

  function handleResearchStateChange(runState: any) {
    commit((latest) => ({
      ...latest,
      researchRun: runState,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleResearchComplete(runState: any) {
    commit((latest) =>
      buildAdvancedState(latest, 'research', {
        researchRun: runState,
      })
    );
  }

  function handleSynthesizeContinue() {
    commit((latest) => ({
      ...latest,
      currentStage: 'validate',
      stageStates: {
        ...latest.stageStates,
        synthesize: 'complete',
        validate: 'active',
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleSynthesizeReviewAgain() {
    commit((latest) => ({
      ...latest,
      synthesisProposals: latest.synthesisProposals.map((p) => ({
        ...p,
        status: 'pending' as const,
      })),
      stageStates: { ...latest.stageStates, synthesize: 'active' },
      updatedAt: new Date().toISOString(),
    }));
  }

  /* Research entries — write directly on latest */
  function handleEntriesChange(next: any[]) {
    commit((latest) => ({
      ...latest,
      researchEntries: next,
    }));
  }

  const acknowledgmentSatisfied = journey.researchRun.status === 'acknowledged';
  const showRail = ['capture', 'clean', 'research', 'synthesize'].includes(
    currentStage
  );

  return (
    <div className="idea-journey-shell">
      <IdeaJourneyBackground />

      <IdeaHeader title={STAGE_TITLE[currentStage]} />

      {showRail && (
        <JourneyProgress
          current={currentStage}
          stageStates={journey.stageStates}
          onJump={handleJump}
        />
      )}

      <div className="typeform-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStage}
            variants={typeformEnter}
            initial="initial"
            animate="animate"
            exit="exit"
            className="typeform-stage__panel"
          >
            {currentStage === 'capture' && (
              <CaptureStage
                initialState={journey.capture}
                isRevisit={isRevisitCapture}
                onChange={(s) => commit((latest) => ({ ...latest, capture: s }))}
                onComplete={handleCaptureComplete as any}
                onAdvance={handleAdvanceFromRevisit}
              />
            )}

            {currentStage === 'clean' && (
              <CleanStage
                initialState={journey.clean}
                isRevisit={isRevisitClean}
                rawCapture={journey.rawCapture}
                structured={journey.structured}
                onChange={(s) => commit((latest) => ({ ...latest, clean: s }))}
                onComplete={handleCleanComplete}
                onAdvance={handleAdvanceFromRevisit}
              />
            )}

            {currentStage === 'research' && (
              <ResearchStage
                ideaId={journey.ideaId}
                runState={journey.researchRun}
                structured={journey.structured}
                rawCapture={journey.rawCapture}
                entries={journey.researchEntries ?? []}
                onRunStateChange={handleResearchStateChange}
                onEntriesChange={handleEntriesChange}
                onComplete={handleResearchComplete}
              />
            )}

            {currentStage === 'synthesize' && (
              <SynthesisStage
                journey={journey}
                onChange={onChange}
                acknowledgmentSatisfied={acknowledgmentSatisfied}
                onGoToResearch={() => handleJump('research')}
                onContinue={handleSynthesizeContinue}
                onReviewAgain={handleSynthesizeReviewAgain}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
