import type { StructuredIdeaCard } from '@/lib/types';

/** Titles should be 5–7 words. Not a sentence. */
const MAX_WORDS = 7;
const MIN_WORDS = 3;

/**
 * deriveIdeaTitle — turn the idea into a short title.
 *
 * Priority: structured problem → value → persona → raw capture first
 * line → 'New idea'.
 *
 * Output is capped at 5–7 words. Real sentences ("Research shows
 * that managers and executives are overwhelmed by AI-generated…")
 * get truncated to the first meaningful phrase.
 */
export function deriveIdeaTitle(
  structured: StructuredIdeaCard | null | undefined,
  rawCapture?: string,
): string {
  const problem = structured?.problem?.value?.trim();
  const value = structured?.value?.value?.trim();
  const persona = structured?.persona?.value?.trim();

  const fromStructured = problem || value || persona;

  /* Fallback — first meaningful line of the raw capture. */
  const firstLine =
    (rawCapture ?? '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? '';

  const base = fromStructured || firstLine;
  if (!base) return 'New idea';

  /* Strip leading articles + filler so the first word is meaningful. */
  const cleaned = base.replace(/^(the|a|an|this|that|these|those)\s+/i, '');

  /* Split on word boundaries. */
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return 'New idea';

  /* Take the first MAX_WORDS words — or fewer if the sentence is short. */
  let slice = words.slice(0, MAX_WORDS);

  /* Try to end on a natural boundary: prefer stopping before a
   * conjunction / preposition if it's past MIN_WORDS. */
  const STOP_BEFORE = new Set([
    'and', 'or', 'but', 'for', 'that', 'which', 'who', 'where',
    'when', 'with', 'without', 'into', 'from', 'by', 'of',
  ]);
  for (let i = slice.length - 1; i >= MIN_WORDS; i--) {
    const w = slice[i].toLowerCase();
    if (STOP_BEFORE.has(w)) {
      slice = slice.slice(0, i);
      break;
    }
  }

  /* Strip trailing punctuation from the last word. */
  if (slice.length > 0) {
    slice[slice.length - 1] = slice[slice.length - 1].replace(/[,;:.!?]+$/, '');
  }

  return slice.join(' ');
}

/** True when the title is the placeholder fallback. */
export function isPlaceholderTitle(t: string | undefined): boolean {
  if (!t) return true;
  const trimmed = t.trim();
  return (
    trimmed === '' ||
    trimmed === 'New idea' ||
    trimmed === 'Untitled idea' ||
    trimmed === 'Untitled'
  );
}
