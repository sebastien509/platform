import type {
  ResearchGap,
  SynthesisProposal,
  StructuredIdeaCard,
} from '@/lib/types';

/* -----------------------------------------------------------------
   Suggested gaps — what to research next, in priority order.
   Real implementation: derive from report content + low-confidence
   claims + unresolved synthesis questions.
   ----------------------------------------------------------------- */

const GAPS_BY_IDEA: Record<string, ResearchGap[]> = {
  idea_001: [
    {
      id: 'gap_pricing',
      title: 'Pricing willingness',
      description:
        'Current research covers market size and competitor pricing, but no direct data on what a 5–20 seat firm would actually pay for this.',
      relatedFields: ['value', 'persona'],
      impact: 'high',
    },
    {
      id: 'gap_onboarding',
      title: 'Onboarding complexity',
      description:
        '"Setup in an afternoon" is an unvalidated assumption. No interviews touched on setup friction or data import.',
      relatedFields: ['value'],
      impact: 'medium',
    },
    {
      id: 'gap_competitive',
      title: 'Incumbent response',
      description:
        'If this wins SMB, how do existing enterprise players respond? Ironclad and Spellbook both have down-market capability.',
      relatedFields: ['sector'],
      impact: 'medium',
    },
  ],
};

export function suggestGaps(ideaId: string): ResearchGap[] {
  return GAPS_BY_IDEA[ideaId] ?? [];
}

/* -----------------------------------------------------------------
   Proposals generated after a targeted thread completes.
   Real implementation: the Synthesis agent reads the new report
   and proposes Idea Card updates the same way it does on the
   first pass.
   ----------------------------------------------------------------- */

const PROPOSALS_BY_GAP: Record<string, (current: StructuredIdeaCard) => SynthesisProposal[]> = {
  gap_pricing: (current) => [
    {
      id: 'sp_pricing_value',
      fieldKey: 'value',
      fieldLabel: 'Value',
      currentValue: current.value?.value,
      proposedValue:
        'Recover 15+ hours a week — priced at $149–249/mo, under the $299+ threshold where small firms self-select out.',
      rationale:
        'Willingness-to-pay research surfaced a hard ceiling around $299. Anchoring the value framing below that makes the pitch concrete.',
      evidenceKnowledgeIds: ['k_009'],
      status: 'pending',
    },
  ],
  gap_onboarding: (current) => [
    {
      id: 'sp_onboarding_value',
      fieldKey: 'value',
      fieldLabel: 'Value',
      currentValue: current.value?.value,
      proposedValue:
        'Recover 15+ hours a week, with live setup in under 3 hours — firm is running real contracts on day one.',
      rationale:
        'Onboarding research measured actual setup time across 6 firms. "Afternoon" was optimistic; "under 3 hours" is defensible.',
      evidenceKnowledgeIds: ['k_010'],
      status: 'pending',
    },
  ],
  gap_competitive: (current) => [
    {
      id: 'sp_competitive_sector',
      fieldKey: 'sector',
      fieldLabel: 'Sector',
      currentValue: current.sector?.value,
      proposedValue:
        'Legal Tech — SMB services, positioned against the down-market gap in enterprise players.',
      rationale:
        'Competitive response analysis confirmed the wedge: enterprise tools can\'t shrink their sales motion without breaking unit economics.',
      evidenceKnowledgeIds: ['k_011'],
      status: 'pending',
    },
  ],
};

export function proposalsForGap(
  gapId: string,
  current: StructuredIdeaCard
): SynthesisProposal[] {
  const factory = PROPOSALS_BY_GAP[gapId];
  return factory ? factory(current) : [];
}
