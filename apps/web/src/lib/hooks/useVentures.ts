import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Venture {
  id: string;
  workspace_id: string;
  source_idea_id: string | null;
  name: string;
  description: string | null;
  status: 'validating' | 'building' | 'launching' | 'operating' | 'paused' | 'archived';
  health: Record<string, number>;
  inherited_hue: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

/* ------------------------------------------------------------
   useVentures — list all ventures the current user can see.
   RLS scopes to the workspaces they belong to.
   ------------------------------------------------------------ */
export function useVentures() {
  return useQuery<Venture[]>({
    queryKey: ['ventures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .is('archived_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Venture[];
    },
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------
   useVenture — single venture by id.
   ------------------------------------------------------------ */
export function useVenture(id: string | undefined) {
  return useQuery<Venture | null>({
    queryKey: ['venture', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as Venture) ?? null;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------
   useCreateVenture — inserts a row. Workspace must exist first
   (created during onboarding).
   ------------------------------------------------------------ */
export function useCreateVenture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      workspaceId,
      description,
    }: {
      name: string;
      workspaceId: string;
      description?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');

      const { data, error } = await supabase
        .from('ventures')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          workspace_id: workspaceId,
          created_by: auth.user.id,
          status: 'validating',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Venture;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventures'] });
    },
  });
}

/**
 * useArchiveVenture — archive an active venture.
 *
 * Sets `archived_at` on the row. The venture disappears from the
 * active list (freeing a Pro slot), but stays in the DB for
 * history and Outcomes.
 */
export function useArchiveVenture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ventureId: string) => {
      const { error } = await supabase
        .from('ventures')
        .update({
          archived_at: new Date().toISOString(),
          status: 'archived',
        })
        .eq('id', ventureId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventures'] });
      qc.invalidateQueries({ queryKey: ['workspace-plan'] });
    },
  });
}

/**
 * useRestoreVenture — un-archive a venture.
 * Only succeeds if the founder has an open slot.
 */
export function useRestoreVenture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ventureId: string) => {
      const { error } = await supabase
        .from('ventures')
        .update({
          archived_at: null,
          status: 'active',
        })
        .eq('id', ventureId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventures'] });
    },
  });
}
