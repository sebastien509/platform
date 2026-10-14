import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AgentBlock } from '@/lib/types';

/* ------------------------------------------------------------
   Threads — one row per agent run.

   Blocks live as a JSONB array. The full timeline replays from
   this row — no reconstruction, no per-block joins.
   ------------------------------------------------------------ */

export type ThreadKind =
  | 'idea_capture'
  | 'idea_clean'
  | 'idea_research'
  | 'idea_synthesize'
  | 'op_run'
  | 'agent_chat';

export type ThreadStatus =
  | 'working'
  | 'needs_you'
  | 'review_ready'
  | 'done'
  | 'failed'
  | 'paused';

export interface ThreadRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  idea_id: string | null;
  venture_id: string | null;
  kind: ThreadKind;
  agent_id: string | null;
  objective: string | null;
  op_id: string | null;
  page: string | null;
  status: ThreadStatus;
  blocks: AgentBlock[];
  conversation_mode: boolean;
  started_at: string;
  completed_at: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UseThreadsOptions {
  ventureId?: string;
  ideaId?: string;
  limit?: number;
}

/* ------------------------------------------------------------
   useThreads — list threads scoped to a venture or idea, or
   all the user's threads when neither is passed.
   ------------------------------------------------------------ */
export function useThreads(options: UseThreadsOptions = {}) {
  const { ventureId, ideaId, limit = 50 } = options;

  return useQuery<ThreadRow[]>({
    queryKey: ['threads', { ventureId, ideaId, limit }],
    queryFn: async () => {
      let q = supabase
        .from('threads')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (ventureId) q = q.eq('venture_id', ventureId);
      else if (ideaId) q = q.eq('idea_id', ideaId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ThreadRow[];
    },
    staleTime: 15_000,
  });
}

/* ------------------------------------------------------------
   useThread — single thread by id. Used when the drawer opens
   a specific run.
   ------------------------------------------------------------ */
export function useThread(id: string | undefined) {
  return useQuery<ThreadRow | null>({
    queryKey: ['thread', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as ThreadRow) ?? null;
    },
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

/* ------------------------------------------------------------
   useCreateThread — new agent run.
   ------------------------------------------------------------ */
export function useCreateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      kind: ThreadKind;
      agentId?: string;
      objective?: string;
      opId?: string;
      page?: string;
      ideaId?: string;
      ventureId?: string;
      workspaceId?: string;
      conversationMode?: boolean;
      blocks?: AgentBlock[];
    }): Promise<ThreadRow> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('threads')
        .insert({
          user_id: auth.user.id,
          kind: input.kind,
          agent_id: input.agentId ?? null,
          objective: input.objective ?? null,
          op_id: input.opId ?? null,
          page: input.page ?? null,
          idea_id: input.ideaId ?? null,
          venture_id: input.ventureId ?? null,
          workspace_id: input.workspaceId ?? null,
          conversation_mode: input.conversationMode ?? false,
          blocks: input.blocks ?? [],
          status: 'working',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ThreadRow;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['threads'] });
      if (input.ventureId) {
        qc.invalidateQueries({
          queryKey: ['threads', { ventureId: input.ventureId }],
        });
      }
      if (input.ideaId) {
        qc.invalidateQueries({
          queryKey: ['threads', { ideaId: input.ideaId }],
        });
      }
    },
  });
}

/* ------------------------------------------------------------
   useUpdateThread — used by the drawer on every block emit.
   Only the columns that change are sent.
   ------------------------------------------------------------ */
export function useUpdateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<{
        blocks: AgentBlock[];
        status: ThreadStatus;
        completed_at: string | null;
        objective: string;
        conversation_mode: boolean;
      }>;
    }) => {
      const { error } = await supabase
        .from('threads')
        .update(input.patch)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['thread', input.id] });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

/* ------------------------------------------------------------
   useDeleteThread
   ------------------------------------------------------------ */
export function useDeleteThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}
