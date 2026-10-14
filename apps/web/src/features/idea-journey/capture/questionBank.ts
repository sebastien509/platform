import type { CaptureSignal } from '@/lib/types';

export const CAPTURE_QUESTIONS = {
  opening: 'Tell me about it. What\'s the problem, and who has it?',
} as const;

/**
 * One follow-up per missing signal. Each is short, one sentence,
 * and never redirects the founder's framing.
 */
export const FOLLOW_UP_QUESTIONS: Record<CaptureSignal, string> = {
  problem:
    'What does that problem actually cost them — time, money, or something else?',
  buyer:
    'Who feels that cost most directly — and who signs off on buying something to fix it?',
  impact:
    'If this works, what changes for them in a typical week?',
  solution:
    'Do you already have a sense of how you\'d solve it, or is that still open?',
  market:
    'What kind of firm or team are you picturing — any specific size or space?',
};
