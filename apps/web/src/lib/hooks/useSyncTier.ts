import { useEffect } from 'react';
import { useWorkspacePlan } from './useWorkspacePlan';
import { useTierStore } from '@/lib/stores/tierStore';

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
    /* plan.tier is already a normalized TierKey — no mapping needed. */
    setTier(plan.tier);
  }, [plan.tier, setTier]);
}
