import type { ArtifactKind, ArtifactProposal, IdeaJourney, VentureDocCitation, VentureDocument } from '@/lib/types';

/* ============================================================
   Product page — research threads + proposal templates
   ============================================================ */

export const PRODUCT_THREADS = [
  {
    id: 'thread_feature_gap',
    kind: 'feature_gap',
    label: 'Feature gap in wedge segment',
  },
  {
    id: 'thread_pricing',
    kind: 'pricing',
    label: 'Pricing tiers and packaging',
  },
  {
    id: 'thread_mvp_scope',
    kind: 'mvp_scope',
    label: 'MVP scope signals from interview set',
  },
] as const;

/**
 * Build proposals using the founder's confirmed Idea Card AND the
 * Strategy docs it inherits. Every proposal's citations include the
 * Strategy docs it was derived from — that's how Product shows its
 * dependency chain.
 */
export function buildProductProposals(
  journey: IdeaJourney,
  ventureName: string,
  strategyDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const { problem, persona, value } = journey.structured;

  /* Citations for Strategy's headline docs — carries their actual
     approval status so Product can flag draft input. */
  const strategyCitations: VentureDocCitation[] = strategyDocs
    .filter((d) => d.isHeadline)
    .map((d) => ({
      docId: d.id,
      title: d.title,
      status: d.status,
      sourcePage: 'strategy',
    }));

  const proposals: ArtifactProposal[] = [];

  /* ---- PRD ---- */
  proposals.push({
    id: `prop_prd_${now}`,
    kind: 'prd',
    title: 'Product Requirements Document',
    rationale: `Drafting the PRD from the confirmed Idea Card and the Strategy ICP. Every requirement traces back to a named problem — nothing gets added without an evidence line.`,
    proposedContent: `## Product Requirements Document — ${ventureName}

**Problem being solved:**
${problem?.value ?? 'See Idea Card'}

**Target user:**
${persona?.value ?? 'See Strategy ICP'}

**Core promise:**
${value?.value ?? 'See Idea Card'}

### P0 — MVP scope

1. **Onboarding** — the user can be running a real use case in under one working session. No multi-day setup.
2. **Core workflow** — the single task that maps directly to the confirmed problem. Nothing else.
3. **Export / handoff** — the output has to leave the product in a form the user can use immediately.

### P1 — Post-launch expansion

Deferred until the first 10 paying users validate the ICP definition holds. Expansion is demand-driven.

### Out of scope for MVP

Anything that requires a multi-user workflow, an admin console, or a support escalation path. Those assume a customer profile we don't have yet.`,
    proposedSummary: 'P0 scope: onboarding, core workflow, export. Everything else waits.',
    citations: strategyCitations,
    status: 'pending',
  });

  /* ---- Feature prioritization ---- */
  proposals.push({
    id: `prop_features_${now}`,
    kind: 'feature_prioritization' as ArtifactKind,
    title: 'Feature Prioritization',
    rationale: `Prioritizing by evidence density — not by effort. Features with a direct citation to a research thread get P0; others wait.`,
    proposedContent: `## Feature Prioritization

### P0 — Directly tied to confirmed problem

| Feature | Evidence | Impact |
|---|---|---|
| Onboarding flow | Research: setup time is the wedge | Blocks trial conversion |
| Core workflow | Interview set: 8 of 12 named this | Direct product value |
| Single-export output | ICP names "usable immediately" | Retention driver |

### P1 — Adjacent, not yet confirmed

Deferred until the P0 set ships and shows signal.

### P2 — Never for MVP

Features that only make sense at scale. Naming them here so they don't creep in.`,
    proposedSummary: 'P0 = direct evidence. P1 = adjacent. P2 = post-scale only.',
    citations: strategyCitations,
    status: 'pending',
  });

  /* ---- Roadmap ---- */
  proposals.push({
    id: `prop_roadmap_${now}`,
    kind: 'roadmap',
    title: 'Product Roadmap',
    rationale: `Six-week roadmap with a hard checkpoint at week 3. Nothing beyond week 6 is committed.`,
    proposedContent: `## Product Roadmap

**Weeks 1–2 — Build the wedge**
Ship the P0 set as a working tool. Narrow scope: no polish, no admin, no analytics.

**Week 3 — First 5 real users**
Hand the tool to 5 ICP-matched users. Watch them use it live. Do not interview them — observe.

**Weeks 4–5 — Close the gaps**
Whatever broke for those 5 users, fix first. Anything they didn't touch, defer.

**Week 6 — Decide**
Two outcomes: scale (10+ users want it) or pivot (signal weaker than expected). No third option.

**Beyond week 6**
Not scheduled. Roadmap reopens based on week 6 signal.`,
    proposedSummary: '6 weeks: build the wedge → 5 real users → fix what broke → decide.',
    citations: strategyCitations,
    status: 'pending',
  });

  return proposals;
}
