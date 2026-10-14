import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import type { AgentRun, AgentBlock, VenturePageId } from '@/lib/types';

/* ------------------------------------------------------------
 DB row shape — public.threads (migration 0006).
 ------------------------------------------------------------ */
interface ThreadRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  idea_id: string | null;
  venture_id: string | null;
  kind: string;
  agent_id: string | null;
  objective: string | null;
  op_id: string | null;
  page: string | null;
  status: string;
  blocks: AgentBlock[] | null;
  conversation_mode: boolean | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRun(row: ThreadRow): AgentRun {
  return {
    id: row.id,
    agentId: row.agent_id ?? 'research',
    ventureId: row.venture_id ?? undefined,
    ideaId: row.idea_id ?? undefined,
    conversationMode: row.conversation_mode ?? false,
    page: (row.page as VenturePageId) ?? undefined,
    status: (row.status as AgentRun['status']) ?? 'done',
    objective: row.objective ?? '',
    blocks: row.blocks ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    opId: row.op_id ?? undefined,
  } as AgentRun;
}

export interface UseRunsOptions {
  ventureId?: string;
  ideaId?: string;
  /** When true, hydrate the store with the fetched rows. Defaults
   *  to true — this is the standard path in the venture shell. */
  hydrate?: boolean;
  limit?: number;
}

/**
 * useRuns — the read primitive for the venture shell.
 *
 * Queries `threads` scoped by venture or idea, then (optionally)
 * hydrates the agent drawer store so reopening the drawer after
 * reload renders the full timeline.
 *
 * Consumers:
 *   · VentureShell (hydration on mount)
 *   · Overview page (recent activity)
 *   · Knowledge page (runs that produced entries)
 *   · Outcomes page (runs that fired external actions)
 */
export function useRuns(options: UseRunsOptions = {}) {
  const { ventureId, ideaId, hydrate = true, limit = 50 } = options;

  const hydrateRuns = useAgentDrawerStore((s) => s.hydrateRuns);

  /* Threads older than 24h that were never closed shouldn't show in
   * the dock. The DB has an hourly cron that closes them, but the
   * client also filters so there's no gap during the hour. */
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const query = useQuery<ThreadRow[]>({
    queryKey: ['runs', ventureId ?? null, ideaId ?? null],
    enabled: Boolean(ventureId || ideaId),
    queryFn: async () => {
      let q = supabase
        .from('threads')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit)
        .or(`closed_at.not.is.null,started_at.gte.${cutoff}`);

      if (ventureId) q = q.eq('venture_id', ventureId);
      if (ideaId) q = q.eq('idea_id', ideaId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ThreadRow[];
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!hydrate) return;
    if (!query.data) return;
    const scope = ventureId ?? ideaId ?? '';
    hydrateRuns(query.data.map(rowToRun), scope);
  }, [hydrate, query.data, ventureId, ideaId, hydrateRuns]);

  return {
    rows: query.data ?? [],
    runs: (query.data ?? []).map(rowToRun),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
