import type {
  ArtifactProposal,
  IdeaJourney,
  VentureDocument,
  VentureDocCitation,
} from '@/lib/types';

export const CAMPAIGN_THREADS = [
  { id: 'thread_briefs', kind: 'briefs', label: 'Brief structure from GTM signals' },
  { id: 'thread_assets', kind: 'assets', label: 'Asset needs per channel' },
  { id: 'thread_calendar', kind: 'calendar', label: 'Publishing cadence feasibility' },
] as const;

export function buildCampaignProposals(
  journey: IdeaJourney,
  ventureName: string,
  sourceDocs: VentureDocument[]
): ArtifactProposal[] {
  const now = Date.now();
  const { value, persona } = journey.structured;

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
      id: `prop_drip_${now}`,
      kind: 'drip_campaign',
      title: 'Drip Campaign',
      rationale: `Message sequence calibrated to the ICP's attention pattern — short, specific, one idea per message.`,
      proposedContent: `## Drip Campaign — ${ventureName}

### Sequence
1. **Why now** — the problem, in the ICP's own words
2. **What we built** — the specific tool, no adjectives
3. **Proof** — one client story, real numbers
4. **Ask** — one clear action

### Timing
4 messages, 3 days apart. No daily drip. Cadence tuned to the ICP's actual week.

### Success criterion
Reply rate above 8%. Below that, the message sequence is wrong — rewrite before sending more.`,
      proposedSummary: '4-message sequence, 3-day spacing. 8% reply floor.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_calendar_${now}`,
      kind: 'content_calendar',
      title: 'Content Calendar',
      rationale: `Six-week calendar mapped to campaign sequence. Founder voice, not marketing voice.`,
      proposedContent: `## Content Calendar

### Weeks 1–2 — Problem
- Post 1: The specific problem, in the ICP's language
- Post 2: Why existing tools fail this problem
- Post 3: What changed

### Weeks 3–4 — Solution
- Post 4: What we built
- Post 5: What it doesn't do (trust through restraint)
- Post 6: First client story

### Weeks 5–6 — Learning
- Post 7: What we got wrong
- Post 8: What we're trying next

**Cadence:** 1 post/week. Fewer, better.`,
      proposedSummary: '6 weeks, 8 posts. One per week. No filler.',
      citations,
      status: 'pending',
    },
    {
      id: `prop_messaging_${now}`,
      kind: 'messaging',
      title: 'Messaging Doc',
      rationale: `Message tones calibrated to ICP persona. What we say, and what we never say.`,
      proposedContent: `## Messaging — ${ventureName}

### Core message
${value?.value ?? 'See Idea Card'}

### Audience
${persona?.value ?? 'See Strategy ICP'}

### Never say
"Revolutionary," "AI-powered," "game-changing," "supercharge," any exclamation point.

### Always say
Specific numbers. Named outcomes. Real customer language.`,
      proposedSummary: 'Direct, specific, evidence-first. No adjectives about the product.',
      citations,
      status: 'pending',
    },
  ];
}
