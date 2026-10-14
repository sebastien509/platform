import type { IdeaAgent } from './types';
import { openaiAgent } from './openaiAgent';
import { mockAgent } from './mockAgent';

/* ============================================================
   getIdeaAgent — the one seam between the rail and its brain.

   Today: openaiAgent (GPT-4.1 via Edge Function).
   mockAgent remains as a fallback for offline dev and tests.
   ============================================================ */
export function getIdeaAgent(): IdeaAgent {
  return openaiAgent;
}

/**
 * Direct access to the mock — used for offline dev, tests, and
 * any code path that needs a deterministic response.
 */
export const fallbackMockAgent = mockAgent;

export type { IdeaAgent } from './types';
