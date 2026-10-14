import type {
  ArtifactProposal,
  IdeaJourney,
  VentureDocument,
  VentureDocCitation,
} from '@/lib/types';

export const GTM_THREADS = [
  { id: 'thread_segments', kind: 'segments', label: 'Segment fit signals' },
  { id: 'thread_channels', kind: 'channels', label: 'Channel viability and cost' },
  { id: 'thread_messaging', kind: 'messaging', label: 'Message resonance in ICP' },
] as const;

export function buildGtmProposals(
  journey: IdeaJourney,
  ventureName: string,
  sourceDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const { sector } = journey.structured;

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
      id: `prop_gtm_plan_${now}`,
      kind: 'gtm_plan',
      title: '90-Day GTM Plan',
      rationale: `Anchoring the entry motion to the confirmed ICP. Three phases — 30 days each — with a decision gate before each next phase.`,
      proposedContent: `## 90-Day GTM Plan — ${ventureName}

### Days 1–30 — Prove the wedge
Single channel. Single message. Reach the confirmed ICP directly — no paid acquisition until the message converts.

### Days 31–60 — Compound what works
Double the winning channel. Add one adjacent channel only if the first has proven ROI. No parallel betting.

### Days 61–90 — Decide
Either the motion holds (scale up) or it doesn't (kill or reposition). No soft-landing third option.

**Gate before each phase:** evidence, not enthusiasm.`,
      proposedSummary: '3 phases, 30 days each. Gate before each. No parallel bets.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_channel_${now}`,
      kind: 'channel_strategy',
      title: 'Channel Strategy',
      rationale: `Channel list calibrated to ${sector?.value ?? 'the sector'} — the ones ICP actually lives in, not the ones marketers default to.`,
      proposedContent: `## Channel Strategy

### Primary
Direct — one-to-one outreach to ICP-matched accounts.

### Secondary
Referral — the ICP's professional network, when the first 10 are happy.

### Explicitly deferred
Paid search, paid social, content marketing. These require a message that converts — which we haven't proven yet.

### Channels tested and rejected
Broad social, cold email at volume, conferences. Cost exceeds signal at this stage.`,
      proposedSummary: 'Direct → referral. Nothing else until the wedge converts.',
      citations,
      status: 'pending',
    },
  ];
}
