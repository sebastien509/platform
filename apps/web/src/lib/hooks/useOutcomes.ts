import { useQuery } from '@tanstack/react-query';
import { outcomeEntries } from '@/data/mockData';
import type { OutcomeEntry, OutcomeDecisionKind } from '@/lib/types';

interface UseOutcomesOptions {
  /** Filter to a specific venture. */
  ventureId?: string;
  /** Filter to a specific idea. */
  ideaId?: string;
  /** Filter to specific decision kinds. */
  decisions?: OutcomeDecisionKind[];
}

async function fetchOutcomes(): Promise<OutcomeEntry[]> {
  // Phase 6: replace with real API call
  return Promise.resolve(outcomeEntries);
}

export function useOutcomes(options: UseOutcomesOptions = {}) {
  const query = useQuery({
    queryKey: ['outcomes'],
    queryFn: fetchOutcomes,
  });

  const filtered = (query.data ?? []).filter((o) => {
    if (options.ventureId && o.sourceVentureId !== options.ventureId) return false;
    if (options.ideaId && o.sourceIdeaId !== options.ideaId) return false;
    if (options.decisions && !options.decisions.includes(o.decision)) return false;
    return true;
  });

  return {
    ...query,
    data: { data: filtered },
    totalCount: query.data?.length ?? 0,
  };
}
