import type {
  IdeaJourney,
  IdeaStage,
  StructuredIdeaCard,
  CaptureState,
  CleanState,
  ResearchRunState,
  SynthesisProposal,
  ValidationState,
  ResearchEntry,
} from '@/lib/types';
import type { IdeaRow } from '@/lib/hooks/useIdeas';

const STAGE_ORDER: IdeaStage[] = [
  'capture',
  'clean',
  'research',
  'synthesize',
  'validate',
  'transition',
];

/**
 * Derive per-stage completion flags from the DB's single `stage`
 * column. If the idea is at `validate`, everything before is done.
 */
function deriveStageStates(stage: IdeaRow['stage']): Record<IdeaStage, any> {
  const states: Record<string, any> = {
    capture: 'locked',
    clean: 'locked',
    research: 'locked',
    synthesize: 'locked',
    validate: 'locked',
    transition: 'locked',
  };

  const normalized: IdeaStage =
    stage === 'transitioned'
      ? 'transition'
      : (stage as IdeaStage);

  const idx = STAGE_ORDER.indexOf(normalized);

  if (stage === 'killed') {
    /* Killed mid-flight — mark everything before validate complete,
     * validate as complete (decision made), transition as locked. */
    states.capture = 'complete';
    states.clean = 'complete';
    states.research = 'complete';
    states.synthesize = 'complete';
    states.validate = 'complete';
    states.transition = 'locked';
    return states;
  }

  if (stage === 'transitioned') {
    STAGE_ORDER.forEach((s) => (states[s] = 'complete'));
    return states;
  }

  STAGE_ORDER.forEach((s, i) => {
    if (i < idx) states[s] = 'complete';
    else if (i === idx) states[s] = 'active';
    else states[s] = 'locked';
  });

  return states;
}

function emptyStructured(): StructuredIdeaCard {
  return {
    problem: null,
    persona: null,
    value: null,
    sector: null,
  } as StructuredIdeaCard;
}

/**
 * Convert a DB idea row into the local IdeaJourney shape.
 *
 * The DB is authoritative for stage + payloads. The converter
 * preserves any structured sub-fields (research, synthesis) that
 * were serialized into the JSON columns, and fills missing fields
 * with safe defaults so downstream components can render.
 */
export function ideaRowToJourney(row: IdeaRow): IdeaJourney {
  const structured = (row.structured ?? {}) as Record<string, any>;
  const capture_payload = (row.capture_payload ?? {}) as Record<string, any>;
  const clean_payload = (row.clean_payload ?? {}) as Record<string, any>;
  const validation_payload = (row.validation ?? {}) as Record<string, any>;

  /* The structured blob doubles as the container for any synthesis
   * or research state persisted alongside the idea card. */
  const researchRun: ResearchRunState =
    structured.researchRun ?? ({} as ResearchRunState);
  const researchEntries: ResearchEntry[] =
    Array.isArray(structured.researchEntries) ? structured.researchEntries : [];
  const synthesisProposals: SynthesisProposal[] =
    Array.isArray(structured.synthesisProposals)
      ? structured.synthesisProposals
      : [];
  const reviewNotes: Record<string, string> =
    structured.reviewNotes && typeof structured.reviewNotes === 'object'
      ? structured.reviewNotes
      : {};

  const validation: ValidationState =
    (validation_payload as ValidationState) ?? ({} as ValidationState);

  const createdVentureId: string | undefined =
    validation_payload?.createdVentureId ?? undefined;

  const now = new Date().toISOString();

  return {
    ideaId: row.id,
    currentStage: (row.stage === 'transitioned' ? 'transition' : row.stage) as IdeaStage,
    stageStates: deriveStageStates(row.stage),

    rawCapture: (capture_payload.rawCapture as string) ?? '',
    structured:
      structured && typeof structured === 'object'
        ? ({ ...emptyStructured(), ...(structured as any) } as StructuredIdeaCard)
        : emptyStructured(),

    capture: capture_payload as CaptureState,
    clean: clean_payload as CleanState,

    researchAgents: [],
    researchRun,
    researchEntries,
    reviewNotes,

    synthesisOverview: structured.synthesisOverview as string | undefined,
    synthesisProposals,

    validation,
    createdVentureId,

    /* Reconstruct `finalized` from the DB so the Validate page
     * renders the LLM's brief after a reload. */
    finalized: structured.overview
      ? {
          title: row.title ?? '',
          overview: structured.overview as string,
          structured: {
            problem: (structured.problem as any) ?? null,
            persona: (structured.persona as any) ?? null,
            value: (structured.value as any) ?? null,
            sector: (structured.sector as any) ?? null,
          },
          finalizedAt: row.updated_at ?? now,
        }
      : undefined,

    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
  };
}
