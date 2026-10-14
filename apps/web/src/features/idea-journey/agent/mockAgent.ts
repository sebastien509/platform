import type { CaptureSignal } from '@/lib/types';
import type {
  IdeaAgent,
  CaptureNextInput,
  CaptureNextOutput,
  CleanNextInput,
  CleanNextOutput,
  ResearchThreadInput,
  ResearchThreadOutput,
  SynthesizeInput,
  SynthesizeOutput,
} from './types';
import type { FinalizeInput, FinalizeOutput } from './types';

/* ============================================================
   mockAgent — a self-contained implementation of IdeaAgent.

   No external helpers. Reproduces the current rail behavior
   closely enough that swapping it in changes nothing visible.
   When 6b.10 ships, `openaiAgent` replaces this behind the same
   interface — the rail never knows the difference.
   ============================================================ */

/* ---------- Capture: a small ordered question bank ---------- */

const CAPTURE_QUESTIONS: Array<{
  question: string;
  targets: CaptureSignal[];
  label: string;
}> = [
  {
    question: 'What problem does this idea solve?',
    targets: ['problem'],
    label: 'Problem',
  },
  {
    question: 'Who feels this problem most acutely?',
    targets: ['buyer'],
    label: 'Buyer',
  },
  {
    question: 'What changes for them once it exists?',
    targets: ['impact', 'solution'],
    label: 'Impact',
  },
  {
    question: 'Why does this matter now?',
    targets: ['market'],
    label: 'Market timing',
  },
];

/* ---------- Clean: reflect → test → sharpen → confirm ---------- */

const CLEAN_MOVES: Array<CleanNextOutput['move']> = [
  'reflect',
  'test',
  'sharpen',
  'confirm',
];

const CLEAN_PROMPTS: Record<string, string[]> = {
  reflect: [
    "Here's what I'm hearing: {value}. Does that match your intent?",
    "Let me read it back — {value}. Anything off?",
  ],
  test: [
    'Would you say that to a stranger at a dinner party?',
    'Is this specific enough that someone could disagree?',
  ],
  sharpen: [
    'Can we tighten it? Which word is doing the most work?',
    'What would you cut to make it sharper?',
  ],
  confirm: [
    "Locked. '{value}' is the field.",
  ],
};

/* ---------- Research: deterministic per kind ---------- */


/* ============================================================
   The implementation
   ============================================================ */

export const mockAgent: IdeaAgent = {
  async captureNext(input: CaptureNextInput): Promise<CaptureNextOutput> {
    // Pick the first question whose targets aren't yet covered.
    const next = CAPTURE_QUESTIONS.find(
      (q) => !q.targets.every((t) => input.covered.includes(t))
    );

    if (!next || input.followUpsRemaining <= 0) {
      return { targets: [], complete: true };
    }

    // Fake streaming — one token per character, batched.
    if (input.onToken) {
      for (const chunk of next.question.match(/.{1,4}/g) ?? [next.question]) {
        input.onToken(chunk);
        await new Promise((r) => setTimeout(r, 12));
      }
    }

    return {
      question: next.question,
      targets: next.targets,
      confirmedLabel: next.label,
      complete: false,
    };
  },

  async cleanNext(input: CleanNextInput): Promise<CleanNextOutput> {
    const move = CLEAN_MOVES[Math.min(input.exchanges.length, 3)];
    const prompts = CLEAN_PROMPTS[move] ?? CLEAN_PROMPTS.reflect;
    const template = prompts[0];
    const question = template.replace('{value}', input.currentValue ?? '…');

    if (input.onToken) {
      for (const chunk of question.match(/.{1,4}/g) ?? [question]) {
        input.onToken(chunk);
        await new Promise((r) => setTimeout(r, 12));
      }
    }

    return {
      move,
      question,
      lockedValue: move === 'confirm' ? input.currentValue : undefined,
      confidence: move === 'confirm' ? 82 : undefined,
    };
  },

  async researchThread(input: ResearchThreadInput): Promise<ResearchThreadOutput> {
    await new Promise((r) => setTimeout(r, 800));

    const stamp = Date.now();
    const base = {
      kind: input.kind,
      confidence: 72,
    };

    const entry =
      input.kind === 'market'
        ? {
            ...base,
            title: 'Market sizing snapshot',
            summary:
              'Bottom-up TAM estimate · SMB segment · 12% CAGR trajectory.',
            sections: [
              {
                id: `s_${stamp}_h`,
                type: 'headline' as const,
                headline: {
                  title: 'Legal SMB contract review is a $4.2B market',
                  kicker: 'Growing 12% annually, underserved below $300/mo.',
                },
                metrics: null,
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_m`,
                type: 'metrics' as const,
                headline: null,
                metrics: [
                  { label: 'TAM', value: '$4.2B' },
                  { label: 'Growth', value: '12%' },
                  { label: 'SAM', value: '$840M' },
                ],
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_t`,
                type: 'table' as const,
                headline: null,
                metrics: null,
                table: {
                  columns: ['Segment', 'Size', 'Willingness to pay'],
                  rows: [
                    ['Solo (1)', '$420M', 'Under $99'],
                    ['Small (2–10)', '$1.9B', '$99–249'],
                    ['Mid (10–50)', '$1.8B', '$249–499'],
                  ],
                  caption: 'Directional estimates; validated against public pricing data.',
                },
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_n`,
                type: 'narrative' as const,
                headline: null,
                metrics: null,
                table: null,
                narrative: {
                  heading: "What's changing",
                  paragraphs: [
                    'Small firms increasingly expect software-grade tools but have no enterprise budget.',
                    'Incumbents price above $300/mo, leaving the SMB tier structurally underserved.',
                  ],
                },
                list: null,
                quote: null,
                callout: null,
              },
            ],
          }
        : input.kind === 'competitor'
        ? {
            ...base,
            title: 'Competitive landscape',
            summary: '6 competitors mapped · all price above $300/mo.',
            sections: [
              {
                id: `s_${stamp}_h`,
                type: 'headline' as const,
                headline: {
                  title: 'Every incumbent prices above the SMB threshold',
                  kicker: 'Structural pricing gap below $300/mo.',
                },
                metrics: null,
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_t`,
                type: 'table' as const,
                headline: null,
                metrics: null,
                table: {
                  columns: ['Name', 'Positioning', 'Price'],
                  rows: [
                    ['Ironclad', 'Enterprise CLM', '$500+'],
                    ['Spellbook', 'In-doc AI', '$400+'],
                    ['LegalOn', 'Contract review', '$350+'],
                    ['ContractPodAi', 'Full suite', '$800+'],
                    ['Luminance', 'AI review', '$500+'],
                    ['Kira', 'ML extraction', 'Custom'],
                  ],
                },
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_c`,
                type: 'callout' as const,
                headline: null,
                metrics: null,
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: {
                  label: 'The wedge',
                  body: 'None of them can shrink their sales motion without breaking unit economics — the down-market tier is unserved by design.',
                },
              },
              {
                id: `s_${stamp}_n`,
                type: 'narrative' as const,
                headline: null,
                metrics: null,
                table: null,
                narrative: {
                  heading: 'Where the gap lives',
                  paragraphs: [
                    'Incumbents sell enterprise motions that start at $50k ACV. Below that, sales cost eats the margin.',
                    'The SMB tier is accessible only through self-serve — which none of them have built.',
                  ],
                },
                list: null,
                quote: null,
                callout: null,
              },
            ],
          }
        : {
            ...base,
            title: 'Customer signal scan',
            summary: '8 of 12 firms interviewed strongly support the pain.',
            sections: [
              {
                id: `s_${stamp}_h`,
                type: 'headline' as const,
                headline: {
                  title: '8 of 12 firms describe the pain as severe',
                  kicker: 'Time loss is the primary driver.',
                },
                metrics: null,
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_m`,
                type: 'metrics' as const,
                headline: null,
                metrics: [
                  { label: 'Pain intensity', value: '86%' },
                  { label: 'Willing to pay', value: '72%' },
                  { label: 'Sign-off', value: 'Partner' },
                ],
                table: null,
                narrative: null,
                list: null,
                quote: null,
                callout: null,
              },
              {
                id: `s_${stamp}_q`,
                type: 'quote' as const,
                headline: null,
                metrics: null,
                table: null,
                narrative: null,
                list: null,
                quote: {
                  text: "I lose a full day per matter just marking up the same clauses over and over.",
                  attribution: 'Managing partner, 8-seat firm',
                },
                callout: null,
              },
              {
                id: `s_${stamp}_n`,
                type: 'narrative' as const,
                headline: null,
                metrics: null,
                table: null,
                narrative: {
                  heading: 'Pattern summary',
                  paragraphs: [
                    'The pain is not theoretical — every interviewee could cite a specific matter where review time cost them margin.',
                    'Buying decisions sit with a single partner in 10 of 12 firms. Sales cycles should be short.',
                  ],
                },
                list: null,
                quote: null,
                callout: null,
              },
            ],
          };

    return {
      entry: {
        ...entry,
        founderPrompt: input.founderPrompt,
      },
    };
  },

  async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
    await new Promise((r) => setTimeout(r, 600));

    const overview =
      input.research.length > 0
        ? 'The research confirms a clear pain signal with a structural gap in the market. Pricing remains the sharpest lever — a sub-$300/mo position unlocks the underserved SMB tier.'
        : 'Add research to get a synthesized view of what the evidence actually shows.';

    const proposals: SynthesizeOutput['proposals'] = [];
    const valueField = input.structured.value;
    if (valueField?.value) {
      proposals.push({
        fieldKey: 'value',
        fieldLabel: 'Value',
        currentValue: valueField.value,
        proposedValue:
          valueField.value +
          ' — priced accessibly below $300/mo for small firms left out by incumbents.',
        rationale:
          'Research showed every incumbent prices above $300/mo, leaving the SMB tier structurally unserved.',
        evidenceKnowledgeIds: input.research
          .filter((r) => r.kind === 'competitor')
          .map((r) => r.id),
        confidence: 78,
      });
    }

    return { overview, proposals };
  },

  async finalize(input: FinalizeInput): Promise<FinalizeOutput> {
    /* Mock — assemble from existing structured + capture. */
    const fallback = 'New idea';
    const first = (input.rawCapture ?? '').split(/\s+/).slice(0, 7).join(' ');
    return {
      title: first || fallback,
      overview:
        input.synthesisOverview ??
        'A concise summary of the idea assembled by the mock agent.',
      structured: input.structured,
    };
  },
};
