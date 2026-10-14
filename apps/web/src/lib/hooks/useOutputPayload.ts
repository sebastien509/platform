import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------
   Output payloads — the DB-stored content blob for outputs
   with content_kind = 'db'. Kept in a sibling table so meta
   queries on outputs never load the content.
   ------------------------------------------------------------ */

export interface OutputPayloadRow {
  output_id: string;
  snapshot: unknown;
  updated_at: string;
}

export function useOutputPayload(outputId: string | undefined) {
  return useQuery<OutputPayloadRow | null>({
    queryKey: ['output_payload', outputId],
    queryFn: async () => {
      if (!outputId) return null;
      const { data, error } = await supabase
        .from('output_payloads')
        .select('*')
        .eq('output_id', outputId)
        .maybeSingle();
      if (error) throw error;
      return (data as OutputPayloadRow) ?? null;
    },
    enabled: Boolean(outputId),
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------
   useUpsertOutputPayload — insert or replace the snapshot.
   Used when an output is created (first write) or versioned
   (subsequent writes).
   ------------------------------------------------------------ */
export function useUpsertOutputPayload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      outputId: string;
      snapshot: unknown;
    }) => {
      const { error } = await supabase
        .from('output_payloads')
        .upsert(
          {
            output_id: input.outputId,
            snapshot: input.snapshot,
          },
          { onConflict: 'output_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({
        queryKey: ['output_payload', input.outputId],
      });
    },
  });
}
