import { useEffect } from 'react';
import { useWorkspacePlan } from './useWorkspacePlan';
import { useTierStore } from '@/lib/stores/tierStore';
import { DB_TIER_TO_KEY, type TierKey } from '@/lib/config/tiers';

/**
 * useSyncTier — mirrors the resolved tier into the sync store.
 * Mount once near the top of the venture tree.
 *
 * The workspace hook returns plan.tier as the DB string
 * ('starter' | 'pro' | 'founder' | 'team'). We normalize to
 * TierKey ('free' | 'pro' | 'founder' | 'team') before storing.
 */
export function useSyncTier() {
  const { plan } = useWorkspacePlan();
  const setTier = useTierStore((s) => s.setTier);

  useEffect(() => {
    const normalized: TierKey =
      DB_TIER_TO_KEY[plan.tier as string] ?? 'pro';
    setTier(normalized);
  }, [plan.tier, setTier]);
}
