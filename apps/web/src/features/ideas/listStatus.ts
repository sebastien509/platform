import type { IdeaJourney, IdeaListStatus } from '@/lib/types';

/**
 * Derives the Ideas List status from the journey state.
 * Falls back to 'capturing' if no journey is available.
 */
export function deriveListStatus(
  journey: IdeaJourney | undefined
): IdeaListStatus {
  if (!journey) return 'capturing';

  if (journey.createdVentureId) return 'validated';
  if (journey.validation.decision === 'kill') return 'killed';

  const stage = journey.currentStage;
  if (stage === 'capture' || stage === 'clean') return 'capturing';

  if (stage === 'research') {
    const run = journey.researchRun;
    if (!run) return 'researching';
    if (run.status === 'running' || run.status === 'idle') return 'researching';
    if (run.status === 'complete' || run.status === 'awaiting_review') {
      return 'awaiting_review';
    }
    // acknowledged → should have advanced past research
    return 'researching';
  }

  if (stage === 'synthesize') return 'refining';
  if (stage === 'validate') return 'ready_to_validate';

  return 'capturing';
}

/** Human-readable status labels. */
export const STATUS_LABELS: Record<IdeaListStatus, string> = {
  capturing: 'Capturing',
  researching: 'Researching',
  awaiting_review: 'Awaiting your review',
  refining: 'Refining',
  ready_to_validate: 'Ready to validate',
  killed: 'Killed',
  validated: 'Validated',
};

/** Short summary used in the compact row — status-specific. */
export function statusDetail(
  status: IdeaListStatus,
  journey: IdeaJourney | undefined
): string | undefined {
  if (!journey) return undefined;

  switch (status) {
    case 'researching': {
      const threads = journey.researchRun?.threads ?? [];
      const complete = threads.filter((t) => t.status === 'complete').length;
      return threads.length > 0
        ? `${complete} of ${threads.length} threads`
        : undefined;
    }
    case 'capturing': {
      const stage = journey.currentStage;
      if (stage === 'capture') {
        const n = journey.capture?.exchanges.length ?? 0;
        return n > 0 ? `${n} exchange${n === 1 ? '' : 's'}` : undefined;
      }
      if (stage === 'clean') {
        const fields = Object.values(journey.clean?.fields ?? {});
        const locked = fields.filter((f) => f.status === 'locked').length;
        return `${locked} of ${fields.length} locked`;
      }
      return undefined;
    }
    case 'awaiting_review':
      return 'Open the research library';
    case 'refining': {
      const total = journey.synthesisProposals.length;
      const resolved = journey.synthesisProposals.filter(
        (p) => p.status !== 'pending'
      ).length;
      return total > 0 ? `${resolved} of ${total} proposals` : undefined;
    }
    case 'ready_to_validate':
      return 'Decision pending';
    case 'killed':
      return journey.validation.note ?? 'Archived';
    case 'validated':
      return journey.createdVentureId ? 'Now a venture' : undefined;
    default:
      return undefined;
  }
}

/** Where clicking the row navigates. */
export function routeForIdea(
  ideaId: string,
  status: IdeaListStatus,
  journey: IdeaJourney | undefined
): string {
  if (status === 'validated' && journey?.createdVentureId) {
    return `/ventures/${journey.createdVentureId}`;
  }
  return `/ideas/${ideaId}`;
}

/* ============================================================
   statusFromStage — map a DB idea stage → IdeaListStatus.
   The DB is authoritative; this is the one-way projection used
   by the Ideas list and IdeaBentoCard.
   ============================================================ */
export function statusFromStage(
  stage:
    | 'capture' | 'clean' | 'research' | 'synthesize' | 'validate'
    | 'transition' | 'transitioned' | 'killed'
): IdeaListStatus {
  switch (stage) {
    case 'capture':      return 'capturing';
    case 'clean':        return 'refining';
    case 'research':     return 'researching';
    case 'synthesize':   return 'awaiting_review';
    case 'validate':     return 'ready_to_validate';
    case 'transition':   return 'ready_to_validate';
    case 'transitioned': return 'validated';
    case 'killed':       return 'killed';
    default:             return 'capturing';
  }
}
