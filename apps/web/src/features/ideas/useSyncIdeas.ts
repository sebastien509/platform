import { useEffect } from 'react';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { useIdeas } from '@/lib/hooks/useIdeas';
import { dbIdeaToLocal } from './dbIdeaConverter';

/**
 * useSyncIdeas — merges DB-backed ideas into journeyStore.
 *
 * Ideas live in journeyStore during Capture → Synthesize. When a founder
 * hits Validate, the idea gets pushed to public.ideas (6b.4). This hook
 * brings any DB idea NOT already in the local store back in — so after
 * a fresh browser, a device switch, or clearing localStorage, pushed
 * ideas still show up in the list.
 *
 * Idempotent: ideas already in the store are skipped by id.
 */
export function useSyncIdeas() {
  const { data: dbIdeas } = useIdeas();

  useEffect(() => {
    if (!dbIdeas || dbIdeas.length === 0) return;

    const state = useJourneyStore.getState();
    const localIds = new Set(state.ideas.map((i) => i.id));

    const missing = dbIdeas
      .filter((row) => !localIds.has(row.id))
      .map((row) => dbIdeaToLocal(row));

    if (missing.length === 0) return;

    useJourneyStore.setState((s) => ({
      ideas: [...s.ideas, ...missing],
    }));
  }, [dbIdeas]);
}
