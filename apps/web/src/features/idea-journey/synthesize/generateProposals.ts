import type {
  SynthesisProposal,
  StructuredIdeaCard,
  ResearchThread,
} from '@/lib/types';

/* -----------------------------------------------------------------
   Initial Synthesize proposals for a fresh journey.

   Runs once, on the first Research acknowledgment. Reads the confirmed
   Idea Card + the research threads, produces 2 proposals that feel
   like specific refinements — not filler.

   Real implementation: an agent reads the actual report content and
   surfaces what's worth updating. This generator uses the founder's
   own language to pick a template.
   ----------------------------------------------------------------- */

function stripPeriod(s: string): string {
  return s.replace(/\.\s*$/, '');
}

function valueRefinement(original: string): string {
  const lower = original.toLowerCase();
  if (lower.includes('hour') || lower.includes('time')) {
    return `${stripPeriod(original)} — capacity that turns into billable work without adding headcount.`;
  }
  if (lower.includes('cost') || lower.includes('$') || lower.includes('money')) {
    return `${stripPeriod(original)} — a direct reduction that shows up on the P&L in month one.`;
  }
  if (lower.includes('faster') || lower.includes('quick')) {
    return `${stripPeriod(original)} — without adding steps or requiring a workflow change.`;
  }
  return `${stripPeriod(original)} — with a concrete, measurable outcome attached.`;
}

function personaRefinement(original: string): string {
  return `${stripPeriod(original)} — specifically those feeling the pain weekly.`;
}

export function generateInitialProposals(
  structured: StructuredIdeaCard,
  threads: ResearchThread[]
): SynthesisProposal[] {
  const proposals: SynthesisProposal[] = [];
  const evidenceIds = threads
    .map((t) => t.knowledgeEntryId)
    .filter((id): id is string => !!id);
  const threadCount = threads.length;
  const now = Date.now();

  /* Every field gets a proposal with explicit before/after. If the
   * founder rejects it, the before stays. If they accept it, the
   * after replaces it. Either way, `structured` never ends up
   * emptier than it started. */
  const fields: Array<{
    key: SynthesisProposal['fieldKey'];
    label: string;
    refine: (v: string) => string;
    rationaleFor: (v: string) => string;
  }> = [
    {
      key: 'value',
      label: 'Value',
      refine: valueRefinement,
      rationaleFor: () =>
        `Research across ${threadCount} threads confirmed the core win. Sharpening the value to name the downstream effect the founder's own language pointed at.`,
    },
    {
      key: 'persona',
      label: 'Persona',
      refine: personaRefinement,
      rationaleFor: () =>
        `Research surfaced the specific segment feeling the pain most acutely. Narrowing the persona to make the wedge sharper.`,
    },
    {
      key: 'problem',
      label: 'Problem',
      refine: (v) =>
        v
          ? `${stripPeriod(v)} — with the cost of inaction quantified.`
          : 'The core problem — restated with the cost of inaction quantified.',
      rationaleFor: () =>
        `Research quantified the cost of the problem. Adding that number to the problem statement makes the pain concrete.`,
    },
    {
      key: 'sector',
      label: 'Sector',
      refine: (v) =>
        v
          ? `${stripPeriod(v)} — narrowed to the fastest-moving segment.`
          : 'The sector — narrowed to the fastest-moving segment.',
      rationaleFor: () =>
        `Research showed a specific sub-segment moving faster than the broader market. Narrowing the sector to match.`,
    },
  ];

  for (const f of fields) {
    const existing = structured[f.key];
    const current = existing?.value ?? '';

    /* Always produce a before/after. Empty current is fine — the
     * proposal becomes "here's what we suggest" for a blank field. */
    proposals.push({
      id: `sp_gen_${f.key}_${now}`,
      fieldKey: f.key,
      fieldLabel: f.label,
      currentValue: current,
      proposedValue: f.refine(current),
      rationale: f.rationaleFor(current),
      evidenceKnowledgeIds: evidenceIds,
      confidence: existing?.status === 'confirmed' ? 75 : 55,
      status: 'pending',
    });
  }

  return proposals;
}
