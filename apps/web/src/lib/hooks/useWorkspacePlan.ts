import { useMemo } from 'react';
import type { WorkspacePlan } from '@/lib/types';
import { useCurrentWorkspace } from './useWorkspace';
import { useVentures } from './useVentures';
import {
  TIER_CONFIG,
  DB_TIER_TO_KEY,
  type TierKey,
} from '@/lib/config/tiers';

/**
 * useWorkspacePlan — the source of truth for the gate.
 *
 * Reads:
 *   · workspace.plan_tier   → the tier string from the DB
 *   · workspace.venture_limit → optional override
 *   · ventures count        → the number actually active
 *
 * Permissive defaults:
 *   · No workspace row       → 'pro'  (no gate)
 *   · Unknown tier value     → 'pro'  (no gate)
 *
 * The gate only fires when the workspace explicitly says the
 * limit is reached. A founder can't get blocked by a schema gap.
 */
export function useWorkspacePlan() {
  const workspace = useCurrentWorkspace();
  const ventures = useVentures();

  const plan: WorkspacePlan = useMemo(() => {
    const ws: any = workspace.data ?? {};
    const rawTier = ws.plan_tier ?? ws.tier;

    /* If the tier is missing or unknown → treat as paid. */
    const tier: TierKey =
      rawTier && DB_TIER_TO_KEY[rawTier]
        ? DB_TIER_TO_KEY[rawTier]
        : 'pro';

    const cfg = TIER_CONFIG[tier];

    const explicitLimit =
      typeof ws.venture_limit === 'number' ? ws.venture_limit : undefined;
    const ventureLimit = explicitLimit ?? cfg.activeVentures;

    /* Only count ACTIVE ventures — archived ones don't consume the slot. */
    const activeVentures = (ventures.data ?? []).filter(
      (v: any) => !v.archived_at && v.status !== 'archived',
    );

    const ventureNames = activeVentures.map((v: any) => v.name);

    return {
      tier,
      venturesUsed: activeVentures.length,
      ventureNames,
      ventureLimit: ventureLimit === Infinity ? 999 : ventureLimit,
    } as WorkspacePlan;
  }, [workspace.data, ventures.data]);

  const isLoading = workspace.isLoading || ventures.isLoading;
  const exhausted =
    !isLoading && plan.venturesUsed >= plan.ventureLimit;

  /* The full tier config — for gates that need more than the plan. */
  const config = TIER_CONFIG[DB_TIER_TO_KEY[plan.tier] ?? 'pro'];

  return { plan, config, isLoading, exhausted };
}
