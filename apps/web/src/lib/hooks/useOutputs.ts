import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------
   Outputs — every deliverable the platform produces.
   Content lives either in output_payloads (kind='db'), storage
   (kind='storage'), or an external URL (kind='external').
   ------------------------------------------------------------ */

export type RenderType =
  | 'markdown'
  | 'html'
  | 'deck'
  | 'report'
  | 'code'
  | 'sheet'
  | 'repo'
  | 'operational';

export type OutputTier = 'primary' | 'secondary';

export type OutputStatus = 'draft' | 'validated' | 'superseded';

export type OutputContentKind = 'db' | 'storage' | 'external';

export interface OutputRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  venture_id: string | null;
  thread_id: string | null;
  produced_by: string;
  render_type: RenderType;
  tier: OutputTier;
  title: string;
  destination: string | null;
  status: OutputStatus;
  content_kind: OutputContentKind;
  content_ref: string | null;
  version: number;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseOutputsOptions {
  ventureId?: string;
  threadId?: string;
  limit?: number;
}

export function useOutputs(options: UseOutputsOptions = {}) {
  const { ventureId, threadId, limit = 100 } = options;

  return useQuery<OutputRow[]>({
    queryKey: ['outputs', { ventureId, threadId, limit }],
    queryFn: async () => {
      let q = supabase
        .from('outputs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (ventureId) q = q.eq('venture_id', ventureId);
      else if (threadId) q = q.eq('thread_id', threadId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OutputRow[];
    },
    staleTime: 15_000,
  });
}

export function useOutput(id: string | undefined) {
  return useQuery<OutputRow | null>({
    queryKey: ['output', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('outputs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as OutputRow) ?? null;
    },
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

export function useCreateOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      producedBy: string;
      renderType: RenderType;
      title: string;
      destination?: string;
      ventureId?: string;
      workspaceId?: string;
      threadId?: string;
      tier?: OutputTier;
      contentKind?: OutputContentKind;
      contentRef?: string;
    }): Promise<OutputRow> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('outputs')
        .insert({
          user_id: auth.user.id,
          produced_by: input.producedBy,
          render_type: input.renderType,
          tier: input.tier ?? 'primary',
          title: input.title,
          destination: input.destination ?? null,
          venture_id: input.ventureId ?? null,
          workspace_id: input.workspaceId ?? null,
          thread_id: input.threadId ?? null,
          content_kind: input.contentKind ?? 'db',
          content_ref: input.contentRef ?? null,
          status: 'draft',
          version: 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data as OutputRow;
    },
    onSuccess: (data, input) => {
      qc.invalidateQueries({ queryKey: ['outputs'] });
      if (input.ventureId) {
        qc.invalidateQueries({
          queryKey: ['outputs', { ventureId: input.ventureId }],
        });
      }
      qc.invalidateQueries({ queryKey: ['output', data.id] });
    },
  });
}

/* ------------------------------------------------------------
   useSupersedeOutput — mark the old output as superseded by
   the new one. Both rows stay queryable; the old one carries
   a pointer to its successor.
   ------------------------------------------------------------ */
export function useSupersedeOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { oldId: string; newId: string }) => {
      const { error } = await supabase
        .from('outputs')
        .update({ status: 'superseded', superseded_by: input.newId })
        .eq('id', input.oldId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outputs'] });
      qc.invalidateQueries({ queryKey: ['output'] });
    },
  });
}

export function useUpdateOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<{
        title: string;
        status: OutputStatus;
        destination: string;
        content_ref: string;
      }>;
    }) => {
      const { error } = await supabase
        .from('outputs')
        .update(input.patch)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['output', input.id] });
      qc.invalidateQueries({ queryKey: ['outputs'] });
    },
  });
}
