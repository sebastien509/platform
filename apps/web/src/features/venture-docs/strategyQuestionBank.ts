import type { ArtifactProposal, IdeaJourney } from '@/lib/types';

/* ============================================================
   Strategy page — research threads + proposal templates
   ============================================================ */

export const STRATEGY_THREADS = [
  {
    id: 'thread_market',
    kind: 'market',
    label: 'Market positioning landscape',
  },
  {
    id: 'thread_competitor',
    kind: 'competitor',
    label: 'Competitive density and gaps',
  },
  {
    id: 'thread_icp',
    kind: 'icp',
    label: 'ICP signals from interview set',
  },
] as const;

/**
 * Proposal templates — one per artifact. Generators take the founder's
 * confirmed Idea Card and produce a proposal the founder can accept,
 * adjusting phrasing but not the underlying claim.
 */
export function buildStrategyProposals(
  journey: IdeaJourney,
  ventureName: string
): ArtifactProposal[] {
  const { problem, persona, value, sector } = journey.structured;
  const now = Date.now();
  const citations = [
    {
      docId: `k_init_problem`,
      title: 'Idea Card · Problem',
      status: 'approved' as const,
      sourcePage: 'strategy' as const,
    },
    {
      docId: `k_init_persona`,
      title: 'Idea Card · Persona',
      status: 'approved' as const,
      sourcePage: 'strategy' as const,
    },
  ];

  const proposals: ArtifactProposal[] = [];

  /* ---- ICP ---- */
  if (persona?.value) {
    const personaValue = persona.value.replace(/\.\s*$/, '');
    proposals.push({
      id: `prop_icp_${now}`,
      kind: 'icp',
      title: 'Ideal Customer Profile',
      rationale: `Persona was locked during the Idea Journey. Sharpening it into a formal ICP with trigger conditions and buying authority.`,
      proposedContent: `## Ideal Customer Profile\n\n**Core persona:** ${personaValue}.\n\n**Trigger condition:** Felt pain weekly — not quarterly. The buyer names the problem before they shop for tools.\n\n**Buying authority:** Single decision-maker. No procurement cycle. Signs off on tooling under $500/mo.\n\n**Disqualifiers:** Teams large enough to already have an internal process; teams without an owner-operator who feels the pain.`,
      proposedSummary: personaValue.slice(0, 120),
      citations,
      status: 'pending',
    });
  }

  /* ---- Positioning ---- */
  if (problem?.value && value?.value) {
    const problemValue = problem.value.replace(/\.\s*$/, '');
    const valueValue = value.value.replace(/\.\s*$/, '');
    proposals.push({
      id: `prop_positioning_${now}`,
      kind: 'positioning',
      title: 'Positioning Statement',
      rationale: `Anchoring positioning in the confirmed problem and value — no new claims introduced.`,
      proposedContent: `## Positioning Statement\n\n**For** ${persona?.value?.replace(/\.\s*$/, '') ?? 'the ICP'} **who** ${problemValue.toLowerCase()}, **${ventureName}** is a ${sector?.value?.replace(/\.\s*$/, '') ?? 'product'} **that** ${valueValue.toLowerCase()}.\n\n**Unlike** enterprise-tier alternatives, ${ventureName} is built for teams that need to be running on day one, not after a multi-week setup.`,
      proposedSummary: `For ${persona?.value?.slice(0, 60) ?? 'the ICP'} — ${valueValue.slice(0, 80)}`,
      citations,
      status: 'pending',
    });
  }

  /* ---- Wedge ---- */
  proposals.push({
    id: `prop_wedge_${now}`,
    kind: 'wedge',
    title: 'Wedge and Entry Point',
    rationale: `Naming the specific entry motion — the smallest slice that lets the venture start shipping while the rest of the strategy stays provisional.`,
    proposedContent: `## Wedge and Entry Point\n\n**Wedge:** The single highest-confidence use case from the Idea Card — the one the founder described in their own words during Capture.\n\n**First 90 days:** Ship the wedge as a narrow, opinionated tool. Do not expand scope until the first 10 paying customers demonstrate the ICP definition holds.\n\n**Expansion path:** Once the wedge holds, layer in adjacent workflows the ICP has already named. Expansion is demand-driven, not roadmap-driven.`,
    proposedSummary: 'Ship the wedge narrow. Expand only when the ICP proves.',
    citations,
    status: 'pending',
  });

  /* ---- Brand ---- */
  proposals.push({
    id: `prop_brand_${now}`,
    kind: 'brand',
    title: 'Brand Direction',
    rationale: `Product and Campaign pages both depend on a Brand doc. Proposed direction is calibrated to the ICP's tone — calm, specific, no aspirational language.`,
    proposedContent: `## Brand Direction\n\n**Tone:** Direct, specific, evidence-first. No adjectives about the product itself. No exclamation points.\n\n**Core vocabulary:** ${sector?.value?.replace(/\.\s*$/, '') ?? 'the category'} language the ICP already uses — not reinvented marketing language.\n\n**Visual register:** Structured. ${sector?.value?.toLowerCase().includes('consumer') ? 'Warm accents on consumer-facing surfaces.' : 'Restrained — the product does the work.'}\n\n**What we never say:** "Revolutionary," "AI-powered," "game-changing." The evidence does the persuasive work.`,
    proposedSummary: 'Direct, specific, evidence-first. No adjectives.',
    citations,
    status: 'pending',
  });

  return proposals;
}
