import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { providerList } from '@/lib/connectors/providers';
import type {
  ConnectorProvider,
  ConnectorStatus,
} from '@/lib/connectors/types';

/* ============================================================
   useConnectors — the merged connector list.

   For each provider in the registry:
     · look for a matching row in public.connectors
     · if found → status from DB (connected/needs_reauth/error)
     · if not → status 'available'
   ============================================================ */

interface ConnectorRow {
  id: string;
  provider: string;
  status: string;
  account_label: string | null;
  connected_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface UnifiedConnector {
  provider: ConnectorProvider;
  name: string;
  category: string;
  icon: string;
  status: ConnectorStatus;
  accountLabel?: string;
  connectedAt?: string;
  permissions: string[];
  usedBy: string[];
  available: boolean;
}

export function useConnectors() {
  const query = useQuery<ConnectorRow[]>({
    queryKey: ['connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .is('revoked_at', null)
        .order('connected_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConnectorRow[];
    },
    staleTime: 15_000,
  });

  const unified: UnifiedConnector[] = useMemo(() => {
    const byProvider = new Map<string, ConnectorRow>();
    for (const row of query.data ?? []) {
      if (!byProvider.has(row.provider)) byProvider.set(row.provider, row);
    }

    return providerList().map((p) => {
      const row = byProvider.get(p.id);
      const status: ConnectorStatus = row
        ? (row.status as ConnectorStatus)
        : 'available';

      return {
        provider: p.id,
        name: p.name,
        category: p.category,
        icon: p.icon,
        status,
        accountLabel: row?.account_label ?? undefined,
        connectedAt: row?.connected_at,
        permissions: p.permissions,
        usedBy: p.usedBy,
        available: p.available ?? false,
      };
    });
  }, [query.data]);

  return {
    connectors: unified,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
