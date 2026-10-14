import type { Idea } from '@/lib/types';

/* ============================================================
   localIdea — helpers for ideas that live only in journeyStore.

   Per the data-architecture doc: ideas stay local-only from
   Capture → Synthesize. The DB is not touched until the founder
   has a validated, structured card ready to save. This module
   generates those local ids and the minimal Idea shape that
   journeyStore + IdeaBentoCard expect.
   ============================================================ */

const LOCAL_PREFIX = 'local_';

export function makeLocalIdeaId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${LOCAL_PREFIX}${ts}_${rand}`;
}

export function isLocalIdeaId(id: string | undefined): boolean {
  return Boolean(id && id.startsWith(LOCAL_PREFIX));
}

export function makeEmptyIdea(id: string, title = 'Untitled idea'): Idea {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description: '',
    problem: '',
    hypothesis: '',
    audience: '',
    phase: 'validate',
    status: 'captured',
    owner: 'You',
    createdAt: now,
    updatedAt: now,
    progress: 0,
    context: {
      evidence: [],
      knowledge: [],
      artifacts: [],
      checkpoints: [],
    },
  };
}
