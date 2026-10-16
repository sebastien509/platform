import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { VentureEvidence } from './useVentureEvidence';

export interface VentureInsight {
  headline: string;
  description: string;
  actionLabel: string | null;
  actionOpId: string | null;
  confidence: number;
}

/**
 * useVentureInsight — calls the ventureInsight edge method with the
 * current page's evidence bundle. Returns one grounded insight.
 *
 * Cached for 60 seconds so navigating between pages doesn't refetch
 * unless the underlying evidence actually changed.
 */
export function useVentureInsight(
  ventureId: string | undefined,
  ventureName: string | null,
  evidence: VentureEvidence,
) {
  return useQuery<VentureInsight>({
    queryKey: [
      'venture-insight',
      ventureId,
      evidence.pageId,
      // Hash of the evidence — refetches when the underlying
      // deliverables, runs, or gaps change.
      evidence.relevantDeliverables.map((d) => d.id).join(','),
      evidence.needsYou.map((r) => r.id).join(','),
      evidence.gaps.map((g) => `${g.kind}:${g.opId ?? g.label}`).join(','),
    ],
    enabled: Boolean(ventureId),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'venture-agent',
        {
          body: {
            method: 'ventureInsight',
            input: {
              venture: {
                id: ventureId,
                name: ventureName,
              },
              page: evidence.pageId,
              focus: evidence.focus,
              deliverables: evidence.relevantDeliverables,
              runs: evidence.recentRuns,
              needsYou: evidence.needsYou,
              gaps: evidence.gaps,
              totalValidated: evidence.totalValidated,
            },
          },
        },
      );
      if (error) throw new Error(error.message);
      const out = (data as any)?.output ?? data;
      if (out?.error) throw new Error(out.message ?? out.error);
      return out as VentureInsight;
    },
  });
}
