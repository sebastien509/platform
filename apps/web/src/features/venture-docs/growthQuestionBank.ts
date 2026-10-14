import type {
  ArtifactProposal,
  IdeaJourney,
  VentureDocument,
  VentureDocCitation,
} from '@/lib/types';

export const GROWTH_THREADS = [
  { id: 'thread_experiment', kind: 'experiment', label: 'Experiment velocity and design' },
  { id: 'thread_compounding', kind: 'compounding', label: 'Channel compounding signals' },
  { id: 'thread_retention', kind: 'retention', label: 'Retention signals across cohorts' },
] as const;

export function buildGrowthProposals(
  _journey: IdeaJourney,
  ventureName: string,
  sourceDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const citations: VentureDocCitation[] = sourceDocs
    .filter((d) => d.isHeadline)
    .map((d) => ({
      docId: d.id,
      title: d.title,
      status: d.status,
      sourcePage: d.producedBy,
    }));

  return [
    {
      id: `prop_experiment_${now}`,
      kind: 'growth_experiment',
      title: 'Growth Experiment Plan',
      rationale: `Experiment sequence calibrated to the ICP's decision cycle. One experiment per cycle — no parallel bets until the first proves ROI.`,
      proposedContent: `## Growth Experiment Plan — ${ventureName}

### Experiment 1 — Channel expansion test
Measure whether the winning GTM channel compounds at 2× spend. If yes, expand. If no, fix message before spending more.

### Experiment 2 — Retention lift
Identify the week-3 dropoff from Analytics. Design one intervention. Measure week-3 retention delta.

### Experiment 3 — Referral loop
Test whether existing users refer. If the answer is no, the product isn't delighting yet — go back to Product.

### Cadence
One experiment per 2-week cycle. Parallel bets destroy signal.`,
      proposedSummary: '3 experiments, 2-week cadence. Serial, not parallel.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_retention_${now}`,
      kind: 'retention_plan',
      title: 'Retention Plan',
      rationale: `Retention is not a metric to optimize — it's a signal to fix. This plan targets the specific dropoff Analytics will surface.`,
      proposedContent: `## Retention Plan

### Current signal
Week-3 retention dropoff. Signal confirmed in Analytics.

### Intervention design
1. Identify the specific behavioral trigger that separates retained users from churned
2. Design one intervention targeting that trigger
3. Ship it, measure week-3 retention delta over 2 cohorts
4. Ship, revert, or iterate — no soft-landing

### What we're not doing
- Adding features (retention isn't a feature problem)
- Discounts or incentives (that buys retention, doesn't earn it)
- "Onboarding tours" (band-aid, not fix)`,
      proposedSummary: 'Fix the trigger, ship, measure. No feature additions.',
      citations,
      status: 'pending',
    },
  ];
}
