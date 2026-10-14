import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OutputShare {
  id: string;
  action: string;
  external_id: string | null;
  response: Record<string, unknown>;
  created_at: string;
}

/**
 * useOutputShares — read the Slack + Notion share history for a
 * specific output. Renders the persistent "Shared ✓" state on
 * the share row after reload / on another device.
 */
export function useOutputShares(outputId: string | null | undefined) {
  return useQuery<OutputShare[]>({
    queryKey: ['output-shares', outputId],
    enabled: Boolean(outputId),
    queryFn: async () => {
      if (!outputId) return [];
      const { data, error } = await supabase
        .from('connector_runs')
        .select('id, action, external_id, response, created_at')
        .eq('output_id', outputId)
        .in('action', ['slack.post-message', 'notion.create-page'])
        .eq('status', 'success')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OutputShare[];
    },
    staleTime: 15_000,
  });
}
