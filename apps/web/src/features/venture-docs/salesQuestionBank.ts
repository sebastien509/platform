import type {
  ArtifactProposal,
  IdeaJourney,
  VentureDocument,
  VentureDocCitation,
} from '@/lib/types';

export const SALES_THREADS = [
  { id: 'thread_pipeline', kind: 'pipeline', label: 'Pipeline shape for the GTM motion' },
  { id: 'thread_outreach', kind: 'outreach', label: 'Outreach sequence resonance' },
  { id: 'thread_discovery', kind: 'discovery', label: 'Discovery question set' },
] as const;

export function buildSalesProposals(
  journey: IdeaJourney,
  ventureName: string,
  sourceDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const { persona, value } = journey.structured;

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
      id: `prop_pipeline_${now}`,
      kind: 'pipeline_design',
      title: 'Pipeline Design',
      rationale: `Pipeline stages matched to how the confirmed ICP actually buys — short cycle, single decision-maker, no committee.`,
      proposedContent: `## Pipeline Design — ${ventureName}

### Stages
1. **Identified** — matched ICP criteria
2. **Contacted** — first touch sent
3. **Engaged** — replied or showed interest
4. **Evaluating** — actively reviewing
5. **Closed** — won or lost

### Cycle target
14 days from Contacted → Closed. Longer means the ICP definition is off.

### What we don't do
Multi-stage procurement flows, pilot programs, "let me think about it" limbo. Either the pain is real or it isn't.`,
      proposedSummary: '5 stages, 14-day cycle target. No procurement theater.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_outreach_${now}`,
      kind: 'outreach_sequence',
      title: 'Outreach Sequence',
      rationale: `Sequence calibrated to ${persona?.value ?? 'the ICP'}'s attention. Short, specific, no follow-up spam.`,
      proposedContent: `## Outreach Sequence

### Message 1 — The specific problem
Reference a real detail from their business. Not a template.

### Message 2 (day 3) — The proof
One client story. One number. No adjectives.

### Message 3 (day 7) — The ask
One clear action. "15 minutes this week?"

### Stop condition
No reply after 3 touches. Do not send a fourth. Silent prospects are not leads.`,
      proposedSummary: '3 messages, 1-week cadence. Stop after 3.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_discovery_${now}`,
      kind: 'discovery_script',
      title: 'Discovery Script',
      rationale: `Discovery questions that surface the pain we already know exists — no fishing, no discovery theater.`,
      proposedContent: `## Discovery Script

### Before the call
Read their public footprint. Have one specific observation ready.

### Questions
1. Walk me through how this works today.
2. What's the part that costs the most time?
3. What have you tried that didn't work?
4. What would need to be true for you to switch?

### What not to ask
"Tell me about your challenges," "What keeps you up at night," any question that invites a marketing answer.

### Listen for
${value?.value ?? 'the value signal already confirmed in Idea Card'}`,
      proposedSummary: '4 questions. One specific observation. No discovery theater.',
      citations,
      status: 'pending',
    },
  ];
}
