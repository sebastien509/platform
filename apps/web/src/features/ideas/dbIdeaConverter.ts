import type { Idea, StructuredIdeaCard } from '@/lib/types';
import type { IdeaRow } from '@/lib/hooks/useIdeas';
import { deriveIdeaTitle, isPlaceholderTitle } from './deriveIdeaTitle';

/**
 * Converts a DB idea row into the local Idea shape.
 *
 * If the row title is a placeholder ("Untitled idea" / "New idea"),
 * derives a real title from the structured card. Legacy rows pushed
 * before the stale-closure fix get rescued on read.
 */
export function dbIdeaToLocal(row: IdeaRow): Idea {
  const structured = row.structured as
    | Record<string, any>
    | null
    | undefined;

  const structuredCard: StructuredIdeaCard = {
    problem: structured?.problem ?? null,
    persona: structured?.persona ?? null,
    value: structured?.value ?? null,
    sector: structured?.sector ?? null,
  };

  const rawTitle = (row.title ?? '').trim();
  const title = isPlaceholderTitle(rawTitle)
    ? deriveIdeaTitle(structuredCard, (row.capture_payload as any)?.rawCapture)
    : rawTitle;

  const description =
    structuredCard.value?.value ??
    structuredCard.problem?.value ??
    '';

  return {
    id: row.id,
    title,
    description,
  } as Idea;
}
