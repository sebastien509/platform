import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Postgres UUID format check. Guards against synthetic ids
 *  (e.g. 'idea_new_xxx' from the old local-first design) being
 *  sent to the DB, where they'd cause a 400. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}


export interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  stage:
    | 'capture' | 'clean' | 'research' | 'synthesize' | 'validate'
    | 'transition' | 'transitioned' | 'killed';
  capture_payload: Record<string, unknown>;
  clean_payload: Record<string, unknown>;
  structured: Record<string, unknown>;
  validation: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------
   useIdeas — list ideas for the current user.
   RLS scopes to the user's own rows.
   ------------------------------------------------------------ */
export function useIdeas() {
  return useQuery<IdeaRow[]>({
    queryKey: ['ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IdeaRow[];
    },
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------
   useIdea — single idea by id.
   ------------------------------------------------------------ */
export function useIdea(id: string | undefined) {
  return useQuery<IdeaRow | null>({
    queryKey: ['idea', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as IdeaRow) ?? null;
    },
    enabled: Boolean(id && isUuid(id)),
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------
   useCreateIdea — QuickAdd lane. Creates a DB row directly,
   skipping the local journey (Capture → Synthesize).

   Note: the full journey for a fresh idea still runs locally in
   journeyStore. This hook is only for the express "capture and
   move on" path from the topbar QuickAdd dialog.
   ------------------------------------------------------------ */
export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      problem?: string;
      hypothesis?: string;
      audience?: string;
      [k: string]: unknown;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');

      const structured: Record<string, unknown> = {};
      if (input.problem) structured.problem = { value: input.problem };
      if (input.hypothesis) structured.hypothesis = { value: input.hypothesis };
      if (input.audience) structured.persona = { value: input.audience };
      if (input.description) structured.description = input.description;

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: auth.user.id,
          title: input.title.trim(),
          stage: 'validate',
          structured,
        })
        .select()
        .single();

      if (error) throw error;
      return data as IdeaRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}

/* ------------------------------------------------------------
   usePushIdea — the single push at Synthesize complete.

   Fires once when the founder finishes the rail. Writes the full
   journey state (structured card, capture, clean, validation) as
   ONE row. No slices. No intermediate writes.

   The result is the server id — stored on the journey as
   `serverId`, and used to filter the local idea out of the list.
   ------------------------------------------------------------ */
export function usePushIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      structured: Record<string, unknown>;
      capture_payload: Record<string, unknown>;
      clean_payload: Record<string, unknown>;
      validation: Record<string, unknown>;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: auth.user.id,
          title: payload.title.trim() || 'Untitled idea',
          stage: 'validate',
          structured: payload.structured,
          capture_payload: payload.capture_payload,
          clean_payload: payload.clean_payload,
          validation: payload.validation,})
        .select()
        .single();

      if (error) throw error;
      return data as IdeaRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}
