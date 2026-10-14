import type { IdeaJourney, Venture } from '@/lib/types';

/**
 * Build a fresh venture from a completed journey.
 *
 * What carries forward:
 *   - Structured Idea Card → strategy.vision / positioning / icp
 *   - Idea Card fields also become knowledge.insights
 *   - Research threads → knowledge.research
 *   - Accepted synthesis proposals → knowledge.decisions
 *
 * Everything else is empty — the founder hasn't built anything yet.
 * Health scores reflect that: strategy ~15, knowledge ~20, rest 0.
 */
export function createVentureFromIdea(
  journey: IdeaJourney,
  name: string
): Venture {
  const now = new Date().toISOString();
  const { problem, persona, value, sector } = journey.structured;

  /* The venture id is deterministic per idea so multiple graduations
     of the same idea don't create collisions. */
  const ventureId = `vent_${journey.ideaId.replace(/^idea_/, '')}`;

  /* Research threads that completed → knowledge.research entries */
  const research = journey.researchRun.threads
    .filter((t) => t.status === 'complete')
    .map((t, i) => ({
      id: `kn_res_${i}`,
      title: t.label,
      content: t.summary ?? '',
      source: `Research Agent · ${t.kind}`,
    }));

  /* Confirmed Idea Card fields → knowledge.insights */
  const insights: Array<{ id: string; title: string; source: string; confidence: string }> = [];
  if (problem?.status === 'confirmed' && problem.value) {
    insights.push({
      id: 'kn_ins_problem',
      title: problem.value,
      source: 'Idea Card · Problem',
      confidence: 'High',
    });
  }
  if (persona?.status === 'confirmed' && persona.value) {
    insights.push({
      id: 'kn_ins_persona',
      title: persona.value,
      source: 'Idea Card · Persona',
      confidence: 'High',
    });
  }
  if (value?.status === 'confirmed' && value.value) {
    insights.push({
      id: 'kn_ins_value',
      title: value.value,
      source: 'Idea Card · Value',
      confidence: 'High',
    });
  }
  if (sector?.status === 'confirmed' && sector.value) {
    insights.push({
      id: 'kn_ins_sector',
      title: sector.value,
      source: 'Idea Card · Sector',
      confidence: 'High',
    });
  }

  /* Accepted synthesis proposals → knowledge.decisions */
  const decisions = journey.synthesisProposals
    .filter((p) => p.status === 'accepted')
    .map((p, i) => ({
      id: `kn_dec_${i}`,
      title: `Accepted: ${p.fieldLabel} → ${p.proposedValue}`,
      madeAt: now,
    }));

  return {
    id: ventureId,
    name,
    description: value?.value || problem?.value || 'Venture created from an idea.',
    ideaId: journey.ideaId,
    status: 'validating',
    owner: 'You',
    createdAt: now,
    updatedAt: now,
    health: {
      strategy: 15,
      product: 0,
      engineering: 0,
      gtm: 5,
      marketing: 0,
      content: 0,
      sales: 0,
      growth: 0,
      analytics: 0,
      knowledge: 20,
      outcomes: 0,
    },
    functions: {
      strategy: {
        vision: value?.value || 'Not defined',
        positioning: problem?.value || 'Not defined',
        decisions: [],
        icp: persona?.value || 'Not defined',
      },
      product: { requirements: [], features: [], roadmap: [] },
      engineering: {
        architecture: '',
        tasks: [],
        environments: {
          development: 'inactive',
          staging: 'inactive',
          production: 'inactive',
        },
        releases: [],
      },
      gtm: {
        icp: persona?.value || 'Not defined',
        segments: [],
        positioning: problem?.value || 'Not defined',
        messaging: '',
        channels: [],
        distribution: '',
        partnerships: [],
        salesMotion: '',
        experiments: [],
        offers: [],
      },
      marketing: {
        brand: '',
        campaigns: [],
        social: [],
        email: [],
        seo: false,
        paid: [],
        events: [],
      },
      content: { strategy: '', calendar: [], drafts: [], assets: [] },
      sales: { prospects: [], pipeline: [], outreach: [] },
      growth: {
        experiments: [],
        acquisition: { organic: 0, paid: 0, referral: 0 },
        activation: { rate: 0 },
        conversion: { rate: 0 },
        retention: { rate: 0 },
        referral: { rate: 0 },
        revenue: { mrr: 0, arr: 0 },
      },
      analytics: {
        acquisition: { visitors: 0, signups: 0, cost: 0 },
        activation: { rate: 0 },
        conversion: { rate: 0 },
        revenue: { mrr: 0, arr: 0 },
        retention: { rate: 0 },
      },
      knowledge: {
        decisions,
        insights,
        research,
      },
      outcomes: { results: [] },
    } as any,
    agentIds: [],
    outcomeIds: [],
  };
}
