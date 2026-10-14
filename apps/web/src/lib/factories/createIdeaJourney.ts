import type {
  IdeaJourney,
  IdeaStage,
  IdeaStageState,
  StructuredIdeaCard,
  CaptureState,
  CleanState,
  ResearchRunState,
} from '@/lib/types';

/**
 * Fresh journey envelope for any idea that doesn't have a saved one yet.
 * Every idea can be walked through the journey without a seed — this is
 * what makes the platform feel like it never dead-ends.
 */
export function createEmptyJourney(ideaId: string): IdeaJourney {
  const now = new Date().toISOString();

  const emptyStructured: StructuredIdeaCard = {
    problem: {
      id: `${ideaId}_f_problem`,
      key: 'problem',
      label: 'Problem',
      value: '',
      status: 'proposed',
    },
    persona: {
      id: `${ideaId}_f_persona`,
      key: 'persona',
      label: 'Persona',
      value: '',
      status: 'proposed',
    },
    value: {
      id: `${ideaId}_f_value`,
      key: 'value',
      label: 'Value',
      value: '',
      status: 'proposed',
    },
    sector: {
      id: `${ideaId}_f_sector`,
      key: 'sector',
      label: 'Sector',
      value: '',
      status: 'proposed',
    },
  };

  const emptyCapture: CaptureState = {
    exchanges: [],
    covered: [],
    followUpsRemaining: 3,
    complete: false,
  };

  const emptyClean: CleanState = {
    fields: {
      problem: { key: 'problem', label: 'Problem', status: 'pending', exchanges: [] },
      persona: { key: 'persona', label: 'Persona', status: 'pending', exchanges: [] },
      value: { key: 'value', label: 'Value', status: 'pending', exchanges: [] },
      sector: { key: 'sector', label: 'Sector', status: 'pending', exchanges: [] },
    },
    activeFieldKey: null,
    order: ['problem', 'persona', 'value', 'sector'],
    complete: false,
  };

  const emptyResearchRun: ResearchRunState = {
    threads: [],
    status: 'idle',
    viewedReportIds: [],
  };

  const stageStates: Record<IdeaStage, IdeaStageState> = {
    capture: 'active',
    clean: 'locked',
    research: 'locked',
    synthesize: 'locked',
    validate: 'locked',
    transition: 'locked',
  };

  return {
    ideaId,
    currentStage: 'capture',
    stageStates,
    rawCapture: '',
    structured: emptyStructured,
    capture: emptyCapture,
    clean: emptyClean,
    researchAgents: [],
    researchRun: emptyResearchRun,
    synthesisProposals: [],
    validation: { decision: null },
    createdAt: now,
    updatedAt: now,
  };
}
