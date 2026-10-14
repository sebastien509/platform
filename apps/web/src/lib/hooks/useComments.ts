import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Comment {
  id: string;
  output_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  resolved: boolean;
  created_at: string;
  section_id: string | null;
  section_label: string | null;
  share_link_id: string | null;
}

/* ------------------------------------------------------------
   useComments — read comments for an output.

   Two call shapes are supported:
     · useComments(outputId)         → fetch when id is present
     · useComments({ outputId })     → options object
     · useComments()                 → no fetch (used by panels
                                        that lazily activate)
   ------------------------------------------------------------ */
type UseCommentsArg = string | null | undefined | { outputId?: string | null };

function extractOutputId(arg: UseCommentsArg): string | null {
  if (!arg) return null;
  if (typeof arg === 'string') return arg;
  return arg.outputId ?? null;
}

export function useComments(arg?: UseCommentsArg) {
  const outputId = extractOutputId(arg);
  return useQuery<Comment[]>({
    queryKey: ['comments', outputId],
    enabled: Boolean(outputId),
    queryFn: async () => {
      if (!outputId) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('output_id', outputId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
    staleTime: 10_000,
  });
}

/* ------------------------------------------------------------
   useCreateComment — post a comment.

   Supports both shapes:
     · useCreateComment(outputId).mutate({ body })
     · useCreateComment().mutate({ outputId, body })
   ------------------------------------------------------------ */
interface CreateInput {
  outputId?: string;
  body: string;
  sectionId?: string;
  sectionLabel?: string;
}

export function useCreateComment(
  defaultOutputId?: string | null | UseCommentsArg
) {
  const capturedId =
    typeof defaultOutputId === 'string' || defaultOutputId == null
      ? extractOutputId(defaultOutputId)
      : extractOutputId(defaultOutputId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const target = input.outputId ?? capturedId;
      if (!target) throw new Error('No output to comment on.');
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated.');
      const { data, error } = await supabase
        .from('comments')
        .insert({
          output_id: target,
          author_id: auth.user.id,
          body: input.body,
          section_id: input.sectionId ?? null,
          section_label: input.sectionLabel ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Comment;
    },
    onSuccess: (_d, vars) => {
      const target = vars.outputId ?? capturedId;
      qc.invalidateQueries({ queryKey: ['comments', target ?? null] });
    },
  });
}

/* ------------------------------------------------------------
   useResolveComment — toggle resolved on a comment.

   Same flexible shape as useCreateComment.
   ------------------------------------------------------------ */
interface ResolveInput {
  outputId?: string;
  id: string;
  resolved: boolean;
}

export function useResolveComment(defaultOutputId?: UseCommentsArg) {
  const capturedId = extractOutputId(defaultOutputId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ResolveInput) => {
      const { error } = await supabase
        .from('comments')
        .update({ resolved: input.resolved })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      const target = vars.outputId ?? capturedId;
      qc.invalidateQueries({ queryKey: ['comments', target ?? null] });
    },
  });
}
