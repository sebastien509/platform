import type { CaptureSignal } from '@/lib/types';

/* -----------------------------------------------------------------
   Lightweight keyword-based signal detection.
   Real implementation: replace with an LLM call. This exists so the
   Capture flow behaves sensibly with mock data.
   ----------------------------------------------------------------- */

const SIGNAL_PATTERNS: Record<CaptureSignal, RegExp[]> = {
  problem: [
    /\b(problem|issue|pain|struggle|frustrat|waste|lose[s]?\s+time|can'?t|cannot|hard|difficult|broken|inefficien)/i,
  ],
  solution: [
    /\b(solve|fix|build|tool|platform|app|service|approach|method|system|solution|automate|automat)/i,
  ],
  buyer: [
    /\b(owner|manager|partner|team|firm|company|business|customer|user|paying|pay[s]?|buyer|decision[- ]maker)/i,
  ],
  impact: [
    /\b(hours?|revenue|cost|savings?|save[s]?|grow|efficien|roi|return|more\s+\w+|better|faster|cheaper|quicker|profit)/i,
  ],
  market: [
    /\b(industry|market|space|sector|niche|vertical|b2b|b2c|saas|enterprise|small\s+business|smb|mid[- ]market)/i,
  ],
};

/**
 * Returns the signals covered by a piece of text.
 */
export function detectSignals(text: string): CaptureSignal[] {
  const covered: CaptureSignal[] = [];
  for (const signal of Object.keys(SIGNAL_PATTERNS) as CaptureSignal[]) {
    const patterns = SIGNAL_PATTERNS[signal];
    if (patterns.some((p) => p.test(text))) covered.push(signal);
  }
  return covered;
}

/**
 * Given the accumulated text, returns the missing signals in priority order.
 * Priority: problem > buyer > impact > solution > market.
 */
const PRIORITY: CaptureSignal[] = ['problem', 'buyer', 'impact', 'solution', 'market'];

export function missingSignals(allText: string): CaptureSignal[] {
  const covered = new Set(detectSignals(allText));
  return PRIORITY.filter((s) => !covered.has(s));
}
