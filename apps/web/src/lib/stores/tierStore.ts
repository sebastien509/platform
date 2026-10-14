import { create } from 'zustand';
import type { TierKey } from '@/lib/config/tiers';

/**
 * tierStore — synchronous access to the current workspace tier.
 *
 * `useWorkspacePlan()` is a hook and can't be called from plain
 * functions like `runAction`. This store caches the resolved tier
 * so any synchronous caller can read it.
 *
 * Permissive default: 'pro'. If the sync hasn't fired yet, we
 * don't want to block a paying user with a premium gate.
 */
interface TierStore {
  tier: TierKey;
  setTier: (t: TierKey) => void;
}

export const useTierStore = create<TierStore>((set) => ({
  tier: 'pro',
  setTier: (t) => set({ tier: t }),
}));

/** Synchronous read for non-React callers. */
export function getTier(): TierKey {
  return useTierStore.getState().tier;
}
