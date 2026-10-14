import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDeliverablesStore } from '@/lib/deliverables/store';
import { listDeliverables } from '@/lib/deliverables/persistence';
import type { Deliverable } from '@/lib/deliverables/types';

/* ============================================================
   useDeliverables — the read path for venture pages.

   Reads from two sources and merges by id:

     · Supabase `outputs` + `output_payloads`  → persisted history
     · Zustand `useDeliverablesStore`          → current session

   The local store wins when it has a *newer* timestamp for the
   same id. That covers the "just validated on this device, DB
   write hasn't landed yet" window without flicker, and it also
   keeps the multi-device case converging on the next refresh.

   Consumers filter by status as needed. This hook returns all
   deliverables for the given scope — draft, review, validated,
   superseded.
   ============================================================ */

interface UseDeliverablesOptions {
  ventureId?: string;
  pageId?: string;
}

interface UseDeliverablesResult {
  data: Deliverable[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

function timestampOf(d: Deliverable): string {
  return d.validatedAt ?? d.supersededAt ?? d.createdAt;
}

export function useDeliverables(
  options: UseDeliverablesOptions = {}
): UseDeliverablesResult {
  const { ventureId, pageId } = options;

  const query = useQuery({
    queryKey: [
      'deliverables',
      { ventureId: ventureId ?? null, pageId: pageId ?? null },
    ],
    queryFn: () => listDeliverables({ ventureId, pageId }),
    enabled: Boolean(ventureId),
    staleTime: 15_000,
  });

  const localDeliverables = useDeliverablesStore((s) => s.deliverables);

  const merged = useMemo(() => {
    const byId = new Map<string, Deliverable>();

    /* 1. DB rows — persisted history */
    for (const d of query.data ?? []) {
      byId.set(d.id, d);
    }

    /* 2. Local store — current session, newer wins */
    for (const d of Object.values(localDeliverables)) {
      if (ventureId && d.ventureId !== ventureId) continue;
      if (pageId && d.pageId !== pageId) continue;

      const existing = byId.get(d.id);
      if (!existing || timestampOf(d) >= timestampOf(existing)) {
        byId.set(d.id, d);
      }
    }

    /* Sort newest-first so the latest version appears on top */
    return Array.from(byId.values()).sort((a, b) =>
      timestampOf(b).localeCompare(timestampOf(a))
    );
  }, [query.data, localDeliverables, ventureId, pageId]);

  return {
    data: merged,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
