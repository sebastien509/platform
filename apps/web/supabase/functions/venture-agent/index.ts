// ============================================================
// venture-agent — Edge Function
//
// The venture shell's LLM runtime. One method: `runOp`.
// The client passes the op definition + venture context + the
// founder's answers, and receives structured output that maps
// to the op's renderType.
//
// Output shape (one of four, dispatch by `kind`):
//   snapshot → ShareSnapshot (surface-backed ops: markdown/html/deck/sheet)
//   payload  → ActionPayload (code/email/json text payloads)
//   confirm  → { heading, body } (operational ops)
//   action   → { provider, verb, summary, params } (connected execute ops)
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const OPENAI_MODEL = 'gpt-4.1';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

/* ============================================================
   ShareSection schema — matches src/lib/share/types.ts
   ============================================================ */

const SHARE_SECTION_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [
        'paragraph',
        'metrics',
        'list',
        'callout',
        'code',
        'timeline',
        'hero',
        'feature-grid',
        'pricing',
        'terms',
      ],
    },
    id: { type: 'string' },
    label: { type: ['string', 'null'] },
    // Per-type payloads — exactly one is populated, the others null.
    paragraph: {
      anyOf: [{ type: 'null' }, { type: 'string' }],
    },
    metrics: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
              delta: { type: ['string', 'null'] },
              trend: {
                anyOf: [
                  { type: 'null' },
                  { type: 'string', enum: ['up', 'down', 'flat'] },
                ],
              },
            },
            required: ['label', 'value', 'delta', 'trend'],
            additionalProperties: false,
          },
        },
      ],
    },
    list: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: ['string', 'null'] },
              meta: { type: ['string', 'null'] },
            },
            required: ['title', 'body', 'meta'],
            additionalProperties: false,
          },
        },
      ],
    },
    callout: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            tone: { type: 'string', enum: ['default', 'attention', 'ready'] },
            body: { type: 'string' },
          },
          required: ['tone', 'body'],
          additionalProperties: false,
        },
      ],
    },
    code: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            language: { type: ['string', 'null'] },
            code: { type: 'string' },
          },
          required: ['language', 'code'],
          additionalProperties: false,
        },
      ],
    },
    timeline: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              when: { type: 'string' },
              title: { type: 'string' },
              body: { type: ['string', 'null'] },
              status: { type: ['string', 'null'] },
            },
            required: ['when', 'title', 'body', 'status'],
            additionalProperties: false,
          },
        },
      ],
    },
    hero: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            eyebrow: { type: ['string', 'null'] },
            headline: { type: 'string' },
            subhead: { type: ['string', 'null'] },
            ctaLabel: { type: ['string', 'null'] },
          },
          required: ['eyebrow', 'headline', 'subhead', 'ctaLabel'],
          additionalProperties: false,
        },
      ],
    },
    featureGrid: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['title', 'body'],
            additionalProperties: false,
          },
        },
      ],
    },
    pricing: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'string' },
              cadence: { type: ['string', 'null'] },
              features: { type: 'array', items: { type: 'string' } },
              highlighted: { type: 'boolean' },
            },
            required: ['name', 'price', 'cadence', 'features', 'highlighted'],
            additionalProperties: false,
          },
        },
      ],
    },
    terms: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['label', 'body'],
            additionalProperties: false,
          },
        },
      ],
    },
  },
  required: [
    'type',
    'id',
    'label',
    'paragraph',
    'metrics',
    'list',
    'callout',
    'code',
    'timeline',
    'hero',
    'featureGrid',
    'pricing',
    'terms',
  ],
  additionalProperties: false,
} as const;

/* ============================================================
   runOp — the single method
   ============================================================ */

const RUN_OP_SCHEMA = {
  name: 'run_op',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['snapshot', 'payload', 'confirm', 'action'],
      },
      // For snapshot outputs (surface-backed ops)
      snapshot: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              title: { type: 'string' },
              kicker: { type: ['string', 'null'] },
              sections: {
                type: 'array',
                items: SHARE_SECTION_SCHEMA,
              },
            },
            required: ['title', 'kicker', 'sections'],
            additionalProperties: false,
          },
        ],
      },
      // For payload outputs (code/email/json text)
      payload: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'text',
                  'json',
                  'email',
                  'email_batch',
                  'html',
                  'link',
                  'confirm',
                ],
              },
              label: { type: 'string' },
              text: { type: ['string', 'null'] },
              json: { type: ['string', 'null'] },
              to: { type: ['string', 'null'] },
              subject: { type: ['string', 'null'] },
              body: { type: ['string', 'null'] },
              url: { type: ['string', 'null'] },
              heading: { type: ['string', 'null'] },
              /* email_batch fields */
              subjectTemplate: { type: ['string', 'null'] },
              bodyTemplate: { type: ['string', 'null'] },
              segments: {
                anyOf: [
                  { type: 'null' },
                  {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        size: { type: ['integer', 'null'] },
                        filter: { type: ['string', 'null'] },
                        personalizationHint: { type: ['string', 'null'] },
                      },
                      required: ['name', 'size', 'filter', 'personalizationHint'],
                      additionalProperties: false,
                    },
                  },
                ],
              },
              personalizationRules: {
                anyOf: [
                  { type: 'null' },
                  {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string' },
                        source: { type: 'string' },
                      },
                      required: ['key', 'source'],
                      additionalProperties: false,
                    },
                  },
                ],
              },
              estimatedRecipients: { type: ['integer', 'null'] },
            },
            required: [
              'type',
              'label',
              'text',
              'json',
              'to',
              'subject',
              'body',
              'url',
              'heading',
              'subjectTemplate',
              'bodyTemplate',
              'segments',
              'personalizationRules',
              'estimatedRecipients',
            ],
            additionalProperties: false,
          },
        ],
      },
      // For operational outputs
      confirm: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['heading', 'body'],
            additionalProperties: false,
          },
        ],
      },
      action: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              verb: { type: 'string' },
              summary: { type: 'string' },
              params: { type: 'string' },
            },
            required: ['provider', 'verb', 'summary', 'params'],
            additionalProperties: false,
          },
        ],
      },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm', 'action'],
    additionalProperties: false,
  },
} as const;

/* ============================================================
   Narrowed schemas — when expectedOutputKind is set, the response
   schema only allows that shape. The LLM physically cannot
   produce the wrong kind.
   ============================================================ */

/* Snapshot-only — kind MUST be 'snapshot', other fields null. */
const SNAPSHOT_ONLY_SCHEMA = {
  name: 'run_op_snapshot',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['snapshot'] },
      snapshot: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          kicker: { type: ['string', 'null'] },
          sections: {
            type: 'array',
            items: SHARE_SECTION_SCHEMA,
          },
        },
        required: ['title', 'kicker', 'sections'],
        additionalProperties: false,
      },
      payload: { type: 'null' },
      confirm: { type: 'null' },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm'],
    additionalProperties: false,
  },
} as const;

/* Payload-only — used for email_batch, code, json ops. */
const PAYLOAD_ONLY_SCHEMA = {
  name: 'run_op_payload',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['payload'] },
      snapshot: { type: 'null' },
      payload: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'text',
              'json',
              'email',
              'email_batch',
              'html',
              'link',
              'confirm',
            ],
          },
          label: { type: 'string' },
          text: { type: ['string', 'null'] },
          json: { type: ['string', 'null'] },
          to: { type: ['string', 'null'] },
          subject: { type: ['string', 'null'] },
          body: { type: ['string', 'null'] },
          html: { type: ['string', 'null'] },
          url: { type: ['string', 'null'] },
          heading: { type: ['string', 'null'] },
          subjectTemplate: { type: ['string', 'null'] },
          bodyTemplate: { type: ['string', 'null'] },
          segments: {
            anyOf: [
              { type: 'null' },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    size: { type: ['integer', 'null'] },
                    filter: { type: ['string', 'null'] },
                    personalizationHint: { type: ['string', 'null'] },
                  },
                  required: ['name', 'size', 'filter', 'personalizationHint'],
                  additionalProperties: false,
                },
              },
            ],
          },
          personalizationRules: {
            anyOf: [
              { type: 'null' },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    source: { type: 'string' },
                  },
                  required: ['key', 'source'],
                  additionalProperties: false,
                },
              },
            ],
          },
          estimatedRecipients: { type: ['integer', 'null'] },
          language: { type: ['string', 'null'] },
          code: { type: ['string', 'null'] },
          slides: {
            anyOf: [
              { type: 'null' },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    eyebrow: { type: ['string', 'null'] },
                    title: { type: 'string' },
                    body: { type: ['string', 'null'] },
                    bullets: {
                      anyOf: [
                        { type: 'null' },
                        { type: 'array', items: { type: 'string' } },
                      ],
                    },
                    metric: {
                      anyOf: [
                        { type: 'null' },
                        {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            value: { type: 'string' },
                          },
                          required: ['label', 'value'],
                          additionalProperties: false,
                        },
                      ],
                    },
                  },
                  required: ['eyebrow', 'title', 'body', 'bullets', 'metric'],
                  additionalProperties: false,
                },
              },
            ],
          },
          tabs: {
            anyOf: [
              { type: 'null' },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    columns: { type: 'array', items: { type: 'string' } },
                    rows: {
                      type: 'array',
                      items: {
                        type: 'array',
                        items: { type: ['string', 'number', 'null'] },
                      },
                    },
                  },
                  required: ['name', 'columns', 'rows'],
                  additionalProperties: false,
                },
              },
            ],
          },
        },
        required: [
          'type',
          'label',
          'text',
          'json',
          'to',
          'subject',
          'body',
          'html',
          'url',
          'heading',
          'subjectTemplate',
          'bodyTemplate',
          'segments',
          'personalizationRules',
          'estimatedRecipients',
          'language',
          'code',
          'slides',
          'tabs',
        ],
        additionalProperties: false,
      },
      confirm: { type: 'null' },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm'],
    additionalProperties: false,
  },
} as const;

/* email_batch-only — narrowest. */
const EMAIL_BATCH_ONLY_SCHEMA = {
  name: 'run_op_email_batch',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['payload'] },
      snapshot: { type: 'null' },
      payload: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['email_batch'] },
          label: { type: 'string' },
          text: { type: 'null' },
          json: { type: 'null' },
          to: { type: 'null' },
          subject: { type: 'null' },
          body: { type: 'null' },
          url: { type: 'null' },
          heading: { type: 'null' },
          subjectTemplate: { type: 'string' },
          bodyTemplate: { type: 'string' },
          segments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                size: { type: ['integer', 'null'] },
                filter: { type: ['string', 'null'] },
                personalizationHint: { type: ['string', 'null'] },
              },
              required: ['name', 'size', 'filter', 'personalizationHint'],
              additionalProperties: false,
            },
          },
          personalizationRules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                source: { type: 'string' },
              },
              required: ['key', 'source'],
              additionalProperties: false,
            },
          },
          estimatedRecipients: { type: ['integer', 'null'] },
        },
        required: [
          'type',
          'label',
          'text',
          'json',
          'to',
          'subject',
          'body',
          'url',
          'heading',
          'subjectTemplate',
          'bodyTemplate',
          'segments',
          'personalizationRules',
          'estimatedRecipients',
        ],
        additionalProperties: false,
      },
      confirm: { type: 'null' },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm'],
    additionalProperties: false,
  },
} as const;

/* Confirm-only. */
const CONFIRM_ONLY_SCHEMA = {
  name: 'run_op_confirm',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['confirm'] },
      snapshot: { type: 'null' },
      payload: { type: 'null' },
      confirm: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['heading', 'body'],
        additionalProperties: false,
      },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm'],
    additionalProperties: false,
  },
} as const;

/* Action-only — for ops that execute a real action on a
   connected service. The LLM produces the config; the client
   then fires the execute call. */
const ACTION_ONLY_SCHEMA = {
  name: 'run_op_action',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['action'] },
      snapshot: { type: 'null' },
      payload: { type: 'null' },
      confirm: { type: 'null' },
      action: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          verb: { type: 'string' },
          summary: { type: 'string' },
          params: { type: 'string' },
        },
        required: ['provider', 'verb', 'summary', 'params'],
        additionalProperties: false,
      },
    },
    required: ['kind', 'snapshot', 'payload', 'confirm', 'action'],
    additionalProperties: false,
  },
} as const;

function schemaForExpectedKind(kind: string | undefined): object {
  switch (kind) {
    case 'snapshot':
      return SNAPSHOT_ONLY_SCHEMA;
    case 'email_batch':
      return EMAIL_BATCH_ONLY_SCHEMA;
    case 'payload':
      return PAYLOAD_ONLY_SCHEMA;
    case 'confirm':
      return CONFIRM_ONLY_SCHEMA;
    case 'action':
      return ACTION_ONLY_SCHEMA;
    default:
      return RUN_OP_SCHEMA;
  }
}

/* ============================================================
   Per-op prompt additions.

   The base prompt tells the LLM how to produce a snapshot.
   Each entry below tells it WHAT the snapshot must contain for
   that specific op — the required section shape, the depth, and
   the content rules that make it useful.

   Keyed by op id. Falls back to base prompt when absent.
   ============================================================ */

const OP_PROMPT_ADDITIONS: Record<string, string> = {
  'strategy.define-icp': `
═══════════════════════════════════════
THIS OP — "Define ICP"
═══════════════════════════════════════
Produce a report with 10 to 12 sections, in this EXACT order:

1. hero — one-line ICP definition
   { eyebrow: "Ideal customer profile", headline: "6-12 words naming who they are",
     subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Typical firm size", value: "20-200 employees" }
   { label: "Primary sector", value: "B2B SaaS" }
   { label: "Pain frequency", value: "Weekly" }
   { label: "Buying authority", value: "Director+" }
   Use real numbers where inferrable. "an estimated" when uncertain.

3. callout (tone: ready) — "The sharpest signal"
   One sentence naming the trait that most reliably predicts a buyer.

4. paragraph — "The buyer"
   2-3 sentences. Names the role, the firm, and the trait in one coherent read.

5. list — "Buying triggers" — 4 to 5 items
   Each { title: "Trigger name", body: "what makes them move", meta: "frequency" }

6. list — "Pain points" — 5 to 6 items
   Each { title: "Pain", body: "with the CONSEQUENCE, not just the description", meta: "severity: high/med/low" }

7. callout (tone: attention) — "Not our buyer"
   2-3 sentences naming who this profile is NOT for. Be specific. This is the
   highest-value section — most ICPs fail by trying to include everyone.

8. list — "Reference archetypes" — exactly 3
   Each { title: "Person's name + role", body: "1-2 sentence vignette — firm, context,
   where they are now", meta: "why they fit" }
   These should read like real people, not personas. Named, specific.

9. feature-grid — "Sectors we win in" — 3 to 4 slices
   Each { title: "Sector name", body: "why we win here — one sentence" }

10. timeline — "Buying journey" — 5 to 6 stages
    Each { when: "Stage 1", title: "What happens", body: "what they feel/do",
    status: "how we help" }
    Start from problem awareness, end at purchase.

11. list — "Open questions" — 2 to 3 items
    Each { title: "Question", body: "what would sharpen this ICP",
    meta: "research gap" }

12. paragraph — "Confidence & sources"
    2 sentences: how confident we are, and which assumptions still need validation.

RULES FOR THIS OP
- Every claim must be specific. Never "SMBs" — say "B2B SaaS firms, 20-200 employees."
- Pain points must name a consequence. Not "they waste time" — "they lose ~10 hours
  per week that doesn't convert to pipeline."
- Reference archetypes must have names. "Sarah Chen, Head of Growth at a Series A
  dev-tools firm" not "the growth leader."
- "Not our buyer" is mandatory. An ICP that excludes nobody is worthless.
- No filler. No "leverage", "synergy", "innovative". Founder-facing language.`,

  // ─────────────────────────────────────────────────────────
  'strategy.define-positioning': `
THIS OP — "Define positioning"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line positioning statement
   { eyebrow: "Positioning", headline: "6-12 words in the format 'For [buyer], we are the [category] that [differentiator]'", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Primary competitor", value: "Named company" }
   { label: "Category", value: "What shelf we sit on" }
   { label: "Core differentiator", value: "3-5 words" }
   { label: "Proof strength", value: "Strong / Moderate / Weak" }

3. callout (tone: ready) — "The claim only you can make"
   One sentence. The sharpest, most defensible claim. Not a slogan.

4. paragraph — "Positioning statement"
   2-3 sentences. Full articulation using the format: "For [buyer], [product] is the [category] that [differentiator], unlike [alternative]."

5. table — "Competitive matrix" — 4-6 rows × 4 columns
   Columns: ["Competitor", "Their positioning", "Core strength", "Weakness we exploit"]
   Every competitor must be a real, named company with real analysis — not "the incumbent".

6. list — "Positioning pillars" — 3-4 items
   Each { title: "Pillar name", body: "what it means and why it's defensible", meta: "proof source" }

7. callout (tone: attention) — "Where this positioning breaks"
   2-3 sentences. Where the claim is vulnerable. Be honest, not defensive.

8. list — "Proof points" — 4-5 items
   Each { title: "Claim supported", body: "the evidence", meta: "severity: high/medium/low" }

9. paragraph — "Confidence & sources"
   2 sentences: how confident we are, and which assumptions still need validation.

RULES FOR THIS OP
- The positioning statement must be one sentence, specific, and falsifiable.
- Every competitor in the matrix is a real, named company.
- "Where this positioning breaks" is mandatory. Positioning without a known failure mode is fantasy.
- No filler. No "leverage", "synergy", "innovative". Founder-facing language.`,
  // ─────────────────────────────────────────────────────────
  'strategy.define-wedge': `
THIS OP — "Define wedge"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line wedge definition
   { eyebrow: "Wedge", headline: "The smallest slice we can win", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "First job", value: "The one job the product must do first" }
   { label: "Entry segment", value: "Who we sell to first" }
   { label: "Time to value", value: "Days / weeks — real number" }
   { label: "Expansion path", value: "Where this wedge leads" }

3. callout (tone: ready) — "The wedge in one line"
   One sentence. The tightest articulation of the entry move.

4. paragraph — "Why this wedge"
   2-3 sentences. The logic: why this specific slice, why now, why us.

5. feature-grid — "Proof points we already have" — 3 to 4 slices
   Each { title: "Proof", body: "specific evidence — a customer, a signal, a technical advantage" }

6. list — "Risks to the wedge" — 4-5 items
   Each { title: "Risk", body: "what could invalidate the wedge, and how we'd know", meta: "severity: high/medium/low" }

7. callout (tone: attention) — "What we are NOT doing"
   2-3 sentences. The paths we're deliberately not taking.

8. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- The wedge is the smallest winnable move, not the grand vision. Be aggressive about narrowing.
- "Time to value" must be a real timeframe — days, weeks. Not "fast".
- Risks must be specific and falsifiable, not abstract.
- "What we are NOT doing" is mandatory. A wedge that excludes nothing isn't a wedge.`,
  // ─────────────────────────────────────────────────────────
  'strategy.draft-pricing-model': `
THIS OP — "Draft pricing model"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line pricing philosophy
   { eyebrow: "Pricing model", headline: "6-12 word pricing thesis", subhead: "One clarifying sentence", ctaLabel: null }

2. paragraph — "Pricing philosophy"
   2-3 sentences. What we charge for, what we don't, and why.

3. pricing — 3 tiers
   Each { name: "Tier", price: "$X", cadence: "mo|yr", features: ["...", "...", "..."], highlighted: true | false }
   Exactly one tier is highlighted — the recommended default.

4. metrics — exactly 4 chips
   { label: "Target ACV", value: "$X" }
   { label: "Gross margin", value: "X%" }
   { label: "Willingness to pay", value: "signal name + value" }
   { label: "Billing cadence", value: "monthly | annual" }

5. list — "Pricing assumptions" — 4 to 5 items
   Each { title: "Assumption", body: "why we believe it", meta: "confidence: high/medium/low" }

6. terms — "Policy & terms" — 4 to 6 items
   Each { label: "Term name", body: "policy detail" }
   Cover at minimum: refunds, cancellation, overage, enterprise path, commitment.

7. callout (tone: attention) — "What could break this model"
   2-3 sentences. The pricing assumption that, if wrong, sinks the model.

8. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Prices are real numbers, not ranges like "$X-Y".
- Features are outcome-oriented, not feature-listy.
- "What could break this model" is mandatory.
- Billing terms must address: cancellation, refund, overage, enterprise path.`,

  // ─────────────────────────────────────────────────────────
  'product.generate-prd': `
THIS OP — "Generate PRD"

Produce a report with 10 to 12 sections, in this EXACT order:

1. hero — one-line PRD summary
   { eyebrow: "Product requirements", headline: "6-12 words naming the product", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Primary user", value: "role + context" }
   { label: "Time to first value", value: "real timeframe" }
   { label: "MVP scope", value: "N features" }
   { label: "Launch target", value: "date or phase" }

3. callout (tone: ready) — "The one thing that must work"
   The single product capability without which nothing else matters.

4. paragraph — "What we're building"
   2-3 sentences naming the product, the user, and the job.

5. list — "Requirements" — 5 to 7 items
   Each { title: "Requirement name", body: "specific, testable", meta: "priority: must/should/could" }

6. list — "Non-goals" — 3 to 5 items
   Each { title: "Non-goal", body: "why we're explicitly not doing this now" }

7. timeline — "Milestones" — 4 to 6 stages
   Each { when: "Week X or Sprint Y", title: "Milestone name", body: "what ships", status: "success criteria" }

8. feature-grid — "Surface area" — 3 to 4 slices
   Each { title: "Surface (e.g. Onboarding, Dashboard, API)", body: "what it contains" }

9. callout (tone: attention) — "Biggest product risk"
   2-3 sentences. What could sink this product.

10. list — "Open questions" — 2 to 3 items
    Each { title: "Question", body: "what needs validation before build" }

11. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Requirements must be testable — a QA engineer could write a test from each.
- Non-goals are mandatory. A PRD with no exclusions is a wishlist.
- Milestones must have real success criteria, not just "ship it".
- No filler. Founder-facing language.`,
  // ─────────────────────────────────────────────────────────
  'engineering.generate-architecture': `
THIS OP — "Generate architecture"

Produce a report with 10 to 12 sections, in this EXACT order:

1. hero — one-line architecture thesis
   { eyebrow: "Architecture", headline: "6-12 words naming the approach", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Stack", value: "primary language + framework" }
   { label: "Deployment target", value: "Vercel / AWS / etc." }
   { label: "Scale target", value: "N users or N req/s" }
   { label: "Time to MVP", value: "real timeframe" }

3. callout (tone: ready) — "The load-bearing decision"
   The single architectural choice everything else hangs on.

4. paragraph — "Approach"
   2-3 sentences naming the pattern (monolith / modular monolith / services) and why.

5. table — "Components" — 5-7 rows by 4 columns
   Columns: ["Component", "Responsibility", "Tech", "Scale notes"]
   Every component is a real system boundary — a nameable thing, not "backend".

6. code — "Interface sketch"
   A short code block showing the primary interface — the API surface or the module boundary. Real, runnable-looking code.

7. list — "Key decisions" — 4 to 6 items
   Each { title: "Decision", body: "what we chose and why", meta: "severity: high/medium/low" }

8. callout (tone: attention) — "Where this breaks"
   2-3 sentences. The failure mode this architecture accepts.

9. list — "Open questions" — 2 to 3 items
   Each { title: "Question", body: "needs resolution before build" }

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Boring tech wins. Recommend the boring choice unless the product demands otherwise.
- Every component must be a real system boundary, not a vague label.
- Code sketch must be real and runnable-looking.
- "Where this breaks" is mandatory.`,

  // ─────────────────────────────────────────────────────────
  'gtm.define-segments': `
THIS OP — "Define segments"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line segmentation thesis
   { eyebrow: "Segmentation", headline: "6-12 words naming the market", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Total segments", value: "N" }
   { label: "Priority segment", value: "name" }
   { label: "Reachable TAM", value: "estimate" }
   { label: "Time to first revenue", value: "real timeframe" }

3. callout (tone: ready) — "The segment to win first"
   One sentence naming the highest-leverage segment and why.

4. paragraph — "How we split the market"
   2-3 sentences on the segmentation lens (role, firm size, need, context).

5. table — "Segments ranked" — 4-6 rows × 4 columns
   Columns: ["Segment", "Size", "Pain intensity", "Why we win"]
   Segment names are specific (e.g. "Clinical ops at 200-500 bed hospitals") not "mid-market".

6. list — "Priority segment deep-dive" — 4 to 5 items
   Each { title: "Attribute", body: "specific, falsifiable", meta: "confidence: high/medium/low" }

7. feature-grid — "Deprioritized segments" — 3 slices
   Each { title: "Segment name", body: "why we're not pursuing this now" }

8. callout (tone: attention) — "Segmentation risk"
   2-3 sentences on what could invalidate the priority segment.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Segment names must be specific and falsifiable.
- Ranked table sorted by priority — highest first.
- Deprioritization is mandatory — a segmentation with no exclusions is a list.
- No filler.`,
  // ─────────────────────────────────────────────────────────
  'gtm.draft-channel-strategy': `
THIS OP — "Draft channel strategy"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line channel thesis
   { eyebrow: "Channel strategy", headline: "6-12 words naming the primary channel", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Primary channel", value: "name" }
   { label: "Target CAC", value: "$X" }
   { label: "Time to signal", value: "real timeframe" }
   { label: "Blended reach", value: "estimate" }

3. callout (tone: ready) — "The channel bet"
   One sentence on the single channel we go all-in on.

4. paragraph — "Approach"
   2-3 sentences on why this channel wins for this venture, at this stage.

5. table — "Channels ranked" — 5-7 rows × 4 columns
   Columns: ["Channel", "Expected CAC", "Time to signal", "Verdict"]
   Real channels — "founder-led LinkedIn", "cold email to ops leaders", "SEO on 'X' keyword". Verdict: go / test / defer.

6. list — "Playbook for the primary channel" — 4 to 6 items
   Each { title: "Step", body: "specific action + cadence", meta: "owner: founder/team" }

7. timeline — "First 90 days" — 4 to 6 stages
   Each { when: "Week X", title: "Milestone name", body: "what ships", status: "success metric" }

8. callout (tone: attention) — "What breaks the channel"
   2-3 sentences on the failure mode.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Real channels, not abstractions. "Content" is not a channel — "weekly LinkedIn essays to X audience" is.
- CAC estimates must be numeric or a tight range.
- 90-day plan has real milestones with real success metrics.
- "What breaks the channel" is mandatory.`,
  // ─────────────────────────────────────────────────────────
  'gtm.draft-messaging': `
THIS OP — "Draft messaging"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line messaging thesis
   { eyebrow: "Messaging", headline: "The one sentence we say everywhere", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Primary promise", value: "5-8 words" }
   { label: "Proof pillar", value: "5-8 words" }
   { label: "Enemy", value: "what we replace" }
   { label: "Tone", value: "plain/technical/warm" }

3. callout (tone: ready) — "The anchor message"
   One sentence, 12-18 words, that everyone on the team can repeat.

4. paragraph — "Messaging principles"
   2-3 sentences on what messages must always do.

5. table — "Message variants per segment" — 3-5 rows × 3 columns
   Columns: ["Segment", "Lead message", "Proof point"]
   Each variant must be different, not just a reworded copy.

6. list — "Objection handling" — 4 to 5 items
   Each { title: "Objection", body: "the response, in the founder's voice", meta: "severity: high/medium/low" }

7. feature-grid — "Message by channel" — 3 slices
   Each { title: "Channel", body: "how the message adapts" }

8. callout (tone: attention) — "Where messaging fails"
   2-3 sentences on the message that would backfire.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Every message must be specific. No "we help teams do X better".
- Message variants per segment must be meaningfully different.
- Objection handling in founder voice, not corporate.
- "Where messaging fails" is mandatory.`,
  // ─────────────────────────────────────────────────────────
  'campaigns.generate-drip-sequence': `
THIS OP — "Generate drip sequence"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line sequence summary
   { eyebrow: "Drip sequence", headline: "6-12 words naming the sequence", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Emails", value: "N" }
   { label: "Cadence", value: "e.g. every 3 days" }
   { label: "Primary goal", value: "activation / upgrade / retention" }
   { label: "Expected open rate", value: "X%" }

3. callout (tone: ready) — "The hook"
   One sentence on the through-line that connects every email.

4. paragraph — "Sequence logic"
   2-3 sentences on who receives this and why.

5. list — "Emails" — 5 to 6 items
   Each { title: "Email 1 · subject line", body: "what the email does + key content", meta: "send: day X" }
   Real subject lines, not "subject goes here".

6. list — "Personalization rules" — 3 to 4 items
   Each { title: "Rule name", body: "what varies and how", meta: "based on: field" }

7. timeline — "Send schedule" — 5 to 6 stages
   Each { when: "Day X", title: "Email name", body: "the job of this email", status: "goal" }

8. callout (tone: attention) — "What kills the sequence"
   2-3 sentences on the failure mode.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Real subject lines, not placeholders.
- Each email has one job. No "catch-up" emails.
- Personalization must be from real data (name, firm, signal) not generic.
- Send schedule must have real timing.`,
  // ─────────────────────────────────────────────────────────
  'sales.generate-discovery-script': `
THIS OP — "Generate discovery script"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line script summary
   { eyebrow: "Discovery script", headline: "6-12 words naming the goal", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Questions", value: "N" }
   { label: "Duration", value: "XX min" }
   { label: "Primary goal", value: "what we must learn" }
   { label: "Next-step", value: "demo / pilot / intro" }

3. callout (tone: ready) — "The one thing to learn"
   One sentence on the single most valuable insight from this call.

4. paragraph — "Approach"
   2-3 sentences on the philosophy — open, diagnostic, non-pitching.

5. list — "Questions" — 6 to 8 items
   Each { title: "Q", body: "the actual question, in the founder's voice", meta: "stage: open/diagnose/close" }
   Real questions, not "ask about their pain". Open-ended, not yes/no.

6. quote — "Sample opener"
   { text: "The exact first sentence to say on the call", attribution: "Founder" }

7. list — "Objection prep" — 4 to 5 items
   Each { title: "Objection", body: "the prepared response", meta: "severity: high/medium/low" }

8. callout (tone: attention) — "Red flags to listen for"
   2-3 sentences on signals that mean "this isn't a fit".

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Real questions, in natural language.
- No yes/no questions — open, diagnostic, judgment-eliciting.
- Objections must be the ones this ICP will actually raise.
- Red flags mandatory.`,
  // ─────────────────────────────────────────────────────────
  'sales.draft-outreach-sequence': `
THIS OP — "Draft outreach sequence"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line sequence thesis
   { eyebrow: "Outreach sequence", headline: "6-12 words naming the approach", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Touches", value: "N" }
   { label: "Channel mix", value: "email + LinkedIn" }
   { label: "Target reply rate", value: "X%" }
   { label: "Send window", value: "e.g. Tue-Thu 8am" }

3. callout (tone: ready) — "The wedge"
   One sentence on what makes this sequence work when others don't.

4. paragraph — "Approach"
   2-3 sentences on the tone and angle.

5. list — "Touches" — 3 to 4 items
   Each { title: "Touch 1 · channel", body: "the full message text — subject + body for emails", meta: "day X" }
   Real message text, not templates.

6. list — "Personalization slots" — 3 to 4 items
   Each { title: "Slot name", body: "how it's filled", meta: "based on: field" }

7. list — "Reply handling" — 3 to 4 items
   Each { title: "Reply type", body: "how to respond", meta: "tone: warm/cold/hard-no" }

8. callout (tone: attention) — "What gets you marked as spam"
   2-3 sentences on what would kill the sender reputation.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Real message text, not templates.
- Every touch must have a distinct job.
- Personalization must be specific and true.
- Reply handling for the 3 common cases (warm, cold, no).`,
  // ─────────────────────────────────────────────────────────
  'sales.share-proposal': `
THIS OP — "Share proposal"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line proposal summary
   { eyebrow: "Proposal", headline: "6-12 words naming the offer", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Scope", value: "what's included" }
   { label: "Duration", value: "real timeframe" }
   { label: "Investment", value: "$X" }
   { label: "Validity", value: "e.g. 14 days" }

3. callout (tone: ready) — "The outcome"
   One sentence on what the client gets.

4. paragraph — "Understanding"
   2-3 sentences restating the client's problem in their own language.

5. list — "Scope of work" — 4 to 6 items
   Each { title: "Deliverable", body: "specific output + when", meta: "phase: X" }

6. pricing — 3 tiers
   Each { name: "Tier", price: "$X", cadence: "one-time/mo", features: [...], highlighted: one }
   Anchored to a value metric — not "hours".

7. terms — 4 to 6 items
   Each { label: "Term name", body: "policy detail" }
   Cover: payment schedule, kickoff, cancellation, IP, confidentiality.

8. timeline — "Delivery plan" — 4 to 6 stages
   Each { when: "Week X", title: "Phase name", body: "what ships", status: "client dependency" }

9. callout (tone: attention) — "What's not included"
   2-3 sentences on scope exclusions.

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Investment is a real number, not a range.
- Payment schedule must be specific.
- Timeline must have client dependencies called out.
- "What's not included" mandatory.`,
  // ─────────────────────────────────────────────────────────
  'sales.summarize-call': `
THIS OP — "Summarize call"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line call summary
   { eyebrow: "Call summary", headline: "6-12 words naming the call outcome", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Attendees", value: "names + roles" }
   { label: "Duration", value: "XX min" }
   { label: "Stage", value: "discovery / demo / negotiation" }
   { label: "Temperature", value: "hot / warm / cold" }

3. callout (tone: ready) — "The key signal"
   One sentence on the strongest positive signal from the call.

4. paragraph — "Context"
   2-3 sentences on who they are and why they took the call.

5. list — "What we heard" — 4 to 6 items
   Each { title: "Signal type", body: "specific quote or observation", meta: "confidence: high/medium/low" }

6. list — "Open questions" — 3 to 4 items
   Each { title: "Question", body: "who owns getting the answer" }

7. list — "Next steps" — 3 to 4 items
   Each { title: "Action", body: "who does what by when", meta: "owner: us/them" }

8. callout (tone: attention) — "Risks surfaced"
   2-3 sentences on what could derail this deal.

9. paragraph — "Confidence & sources"
   2 sentences.

RULES FOR THIS OP
- Real quotes when possible — paraphrases only when necessary.
- Next steps must have owners and dates.
- Risks must be specific, not generic.
- Temperature rating must be honest.`,

  // ─────────────────────────────────────────────────────────
  'growth.design-experiment': `
THIS OP — "Design experiment"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line experiment summary
   { eyebrow: "Growth experiment", headline: "6-12 words naming the hypothesis", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Hypothesis", value: "if X then Y" }
   { label: "Variants", value: "N" }
   { label: "Success metric", value: "primary metric" }
   { label: "Sample size", value: "N" }

3. callout (tone: ready) — "The one bet"
   One sentence on the single variable being tested.

4. paragraph — "Hypothesis"
   2-3 sentences. The full if-then-because form.

5. list — "Variants" — 2 to 4 items
   Each { title: "Variant name", body: "the exact change vs. control", meta: "split: X%" }

6. metrics — exactly 4 chips (second block)
   { label: "Primary metric", value: "name" }
   { label: "Target lift", value: "X%" }
   { label: "Test duration", value: "real timeframe" }
   { label: "Guardrail metric", value: "what must not regress" }

7. list — "Guardrails" — 3 to 4 items
   Each { title: "Guardrail", body: "what would make us stop early", meta: "threshold: value" }

8. timeline — "Rollout plan" — 4 to 5 stages
   Each { when: "Day X", title: "Phase", body: "what happens", status: "decision gate" }

9. callout (tone: attention) — "What could invalidate the test"
   2-3 sentences on confounding factors.

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Hypothesis must be falsifiable in one sentence.
- Sample size is a real number based on baseline + target lift.
- Guardrails are mandatory — what stops the test.
- Test duration must be real, not "until significance".`,
  // ─────────────────────────────────────────────────────────
  'growth.draft-retention-plan': `
THIS OP — "Draft retention plan"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line retention thesis
   { eyebrow: "Retention plan", headline: "6-12 words naming the retention angle", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Current retention", value: "X% at D30/M3" }
   { label: "Target retention", value: "X%" }
   { label: "Primary lever", value: "what we change" }
   { label: "Time to signal", value: "real timeframe" }

3. callout (tone: ready) — "The retention bet"
   One sentence on the single change that moves retention most.

4. paragraph — "Diagnosis"
   2-3 sentences on why users churn today.

5. list — "Churn signals" — 4 to 5 items
   Each { title: "Signal", body: "what we observe", meta: "severity: high/medium/low" }

6. list — "Interventions" — 4 to 6 items
   Each { title: "Intervention", body: "what we ship + when in the lifecycle", meta: "effort: high/medium/low" }

7. timeline — "Rollout sequence" — 4 to 6 stages
   Each { when: "Week X", title: "Intervention", body: "what ships", status: "expected lift" }

8. feature-grid — "Instrumentation" — 3 slices
   Each { title: "What we track", body: "how we know it works" }

9. callout (tone: attention) — "What doesn't work"
   2-3 sentences on retention tactics we're deliberately not using.

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Retention numbers are real (D7, D30, M3).
- Interventions target specific lifecycle moments.
- Expected lift must be a range, not a promise.
- "What doesn't work" is required — some tactics are traps.`,
  // ─────────────────────────────────────────────────────────
  'funding.draft-one-pager': `
THIS OP — "Draft one-pager"

Produce a report with 8 to 10 sections, in this EXACT order:

1. hero — one-line company summary
   { eyebrow: "One-pager", headline: "6-12 words naming the company", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Stage", value: "pre-seed / seed / Series A" }
   { label: "Round size", value: "$X" }
   { label: "Traction", value: "key metric" }
   { label: "Team", value: "founder names + credentials" }

3. callout (tone: ready) — "The wedge"
   One sentence on the single biggest reason to believe.

4. paragraph — "Problem"
   2-3 sentences on the pain.

5. paragraph — "Solution"
   2-3 sentences on what the product does.

6. metrics — exactly 4 chips (traction block)
   { label: "Revenue", value: "$X ARR / MRR" }
   { label: "Growth", value: "X% MoM" }
   { label: "Users", value: "N" }
   { label: "Retention", value: "X%" }

7. list — "Why now" — 3 to 4 items
   Each { title: "Market shift", body: "what changed", meta: "confidence: high/medium/low" }

8. list — "Team" — 2 to 3 items
   Each { title: "Founder name + role", body: "relevant experience", meta: "why them" }

9. paragraph — "Ask"
   2-3 sentences on the round size, use of funds, and what unlocks next.

RULES FOR THIS OP
- Every metric is real or clearly labeled as projection.
- Traction is the highest-signal section — quantify everything.
- Team bios focus on relevant experience.
- Ask is specific — a number, a timeline, and a use-of-funds.`,
  // ─────────────────────────────────────────────────────────
  'funding.prepare-investor-faq': `
THIS OP — "Prepare investor FAQ"

Produce a report with 10 to 12 sections, in this EXACT order:

1. hero — one-line FAQ summary
   { eyebrow: "Investor FAQ", headline: "6-12 words naming the focus", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Questions", value: "N" }
   { label: "Categories", value: "market / product / traction / team / raise" }
   { label: "Stage", value: "pre-seed / seed / A" }
   { label: "Completeness", value: "X%" }

3. callout (tone: ready) — "The answer that wins the room"
   One sentence on the strongest response in the FAQ.

4. paragraph — "Approach"
   2-3 sentences on how the FAQ is structured and how to use it.

5. list — "Market & opportunity" — 3 to 4 items
   Each { title: "Question", body: "the full drafted answer", meta: "confidence: high/medium/low" }

6. list — "Product & differentiation" — 3 to 4 items
   Each { title: "Question", body: "the full drafted answer", meta: "confidence: high/medium/low" }

7. list — "Traction & metrics" — 3 to 4 items
   Each { title: "Question", body: "the full drafted answer", meta: "confidence: high/medium/low" }

8. list — "Team & hiring" — 2 to 3 items
   Each { title: "Question", body: "the full drafted answer", meta: "confidence: high/medium/low" }

9. list — "The raise" — 3 to 4 items
   Each { title: "Question", body: "the full drafted answer", meta: "confidence: high/medium/low" }

10. list — "The hard questions" — 3 to 4 items
    Each { title: "Question", body: "the honest answer — no spin", meta: "severity: high/medium/low" }

11. callout (tone: attention) — "Where we don't have an answer yet"
    2-3 sentences on the honest gaps.

12. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Questions must be the real ones an investor will ask, not softballs.
- Answers are drafted in the founder's voice, ready to use.
- "The hard questions" section is mandatory — investors respect honesty.
- "Where we don't have an answer yet" is required — no founder has all answers.`,
  // ─────────────────────────────────────────────────────────
  'funding.build-target-list': `
THIS OP — "Build target list"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line target list summary
   { eyebrow: "Investor targets", headline: "6-12 words naming the thesis fit", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Targets", value: "N" }
   { label: "Median check", value: "$X" }
   { label: "Stage fit", value: "pre-seed / seed / A" }
   { label: "Geography", value: "primary region" }

3. callout (tone: ready) — "The lead candidate"
   One sentence naming the highest-fit investor and why.

4. paragraph — "Sourcing thesis"
   2-3 sentences on how the list was built — thesis fit, stage, sector, check size.

5. table — "Target investors" — 8-12 rows × 4 columns
   Columns: ["Investor", "Firm", "Check size", "Why fit"]
   Named real investors with real firms. Why-fit is specific.

6. list — "Prioritization" — 3 to 4 items
   Each { title: "Tier", body: "which investors, in what order, why", meta: "count: N" }

7. list — "Warm intro paths" — 3 to 4 items
   Each { title: "Investor", body: "who can intro us, through what relationship", meta: "strength: strong/medium/weak" }

8. feature-grid — "Sector fit" — 3 slices
   Each { title: "Sub-sector", body: "why this group of investors cares" }

9. callout (tone: attention) — "Who we're not targeting"
   2-3 sentences on the investors we're deliberately skipping and why.

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Every investor is a real person at a real firm.
- Check size is a real range, not "anything".
- Why-fit is specific to this venture, not generic.
- "Who we're not targeting" is mandatory.`,
  // ─────────────────────────────────────────────────────────
  'funding.draft-investor-update': `
THIS OP — "Draft investor update"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line update summary
   { eyebrow: "Investor update", headline: "6-12 words naming the month", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Period", value: "month + year" }
   { label: "Revenue", value: "$X MRR / ARR" }
   { label: "Growth", value: "X% MoM" }
   { label: "Runway", value: "N months" }

3. callout (tone: ready) — "The headline"
   One sentence on the single most important thing this month.

4. paragraph — "Where we are"
   2-3 sentences on the state of the business.

5. list — "Highlights" — 4 to 5 items
   Each { title: "Win", body: "specific number or outcome", meta: "category: product/growth/team/fundraise" }

6. list — "Lowlights" — 2 to 4 items
   Each { title: "Miss", body: "what didn't go to plan and what we're doing about it", meta: "severity: high/medium/low" }

7. list — "Metrics" — 4 to 6 items
   Each { title: "Metric", body: "value + trend", meta: "confidence: high/medium/low" }

8. list — "Asks" — 2 to 3 items
   Each { title: "Ask", body: "specific help we need", meta: "urgency: high/medium/low" }

9. paragraph — "Looking ahead"
   2-3 sentences on the next 30 days.

10. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Every highlight is quantified. "We grew" is not a highlight.
- Lowlights are mandatory — investors respect honesty more than spin.
- Asks are specific. Not "intro if you can" — "intro to X at Y".
- Tone is direct, founder-to-investor.`,
  // ─────────────────────────────────────────────────────────
  'funding.prepare-data-room': `
THIS OP — "Prepare data room"

Produce a report with 9 to 11 sections, in this EXACT order:

1. hero — one-line data room summary
   { eyebrow: "Data room", headline: "6-12 words naming the readiness level", subhead: "One clarifying sentence", ctaLabel: null }

2. metrics — exactly 4 chips
   { label: "Categories", value: "N" }
   { label: "Documents", value: "N" }
   { label: "Readiness", value: "X%" }
   { label: "Last updated", value: "date" }

3. callout (tone: ready) — "The most-requested doc"
   One sentence naming the file investors ask for first.

4. paragraph — "Diligence readiness"
   2-3 sentences on the current state and what's still missing.

5. list — "Corporate documents" — 3 to 4 items
   Each { title: "Doc name", body: "purpose + who owns it", meta: "status: ready/pending" }

6. list — "Financial" — 3 to 4 items
   Each { title: "Doc name", body: "purpose + who owns it", meta: "status: ready/pending" }

7. list — "Product & tech" — 3 to 4 items
   Each { title: "Doc name", body: "purpose + who owns it", meta: "status: ready/pending" }

8. list — "Team & legal" — 3 to 4 items
   Each { title: "Doc name", body: "purpose + who owns it", meta: "status: ready/pending" }

9. list — "Commercial" — 3 to 4 items
   Each { title: "Doc name", body: "purpose + who owns it", meta: "status: ready/pending" }

10. callout (tone: attention) — "What's still missing"
    2-3 sentences on the docs we don't have yet.

11. paragraph — "Confidence & sources"
    2 sentences.

RULES FOR THIS OP
- Every doc has a real name (e.g. "Certificate of Incorporation") not "legal stuff".
- Status is honest — ready / pending / blocked.
- Coverage includes the 5 standard categories.
- "What's still missing" is mandatory.`,

  // ─────────────────────────────────────────────────────────
  'gtm.generate-landing': `
THIS OP — "Generate landing"

Produce kind: "payload" with payload.type: "html".
payload.html is a COMPLETE, SELF-CONTAINED HTML DOCUMENT.
payload.label is a short human title (e.g. "Landing page — v1").
All other payload fields are null.

PAGE STRUCTURE
1. <head> — meta charset + viewport, Google Fonts <link>, inline <style>
2. Nav bar — logo/brand on left, one or two nav links, primary CTA button on right
3. Hero — eyebrow, headline (8-12 words), subhead (1-2 sentences), primary CTA, secondary "learn more" link
4. Feature grid — 3 columns, each: icon (SVG), title (3-5 words), body (1-2 sentences)
5. Social proof — 2-3 testimonial or stat blocks side by side
6. Final CTA — headline + primary button, centered
7. Footer — brand mark, minimal links, copyright

DESIGN SYSTEM (modern defaults — swap when design spec is wired in)
- Palette: primary #2563EB, primary-hover #1E4EDB, surface #FFFFFF, canvas #F9FAFB, text #111827, muted #6B7280, border #E5E7EB
- Font: Inter for everything — <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px
- Radius: 6 / 10 / 16 px (buttons/cards/hero blocks)
- Shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)
- Max content width: 1080px, centered with 24px horizontal padding

RULES
- ONE self-contained HTML document. No external CSS or JS files.
- Inline <style> in <head>. No utility classes. No Tailwind. Write real CSS.
- Real copy from the venture context. No lorem ipsum.
- Mobile responsive: single column under 720px (use @media queries).
- NO <script> tags. NO trackers. Only external resource allowed is the Google Fonts <link>.
- Every color, spacing, and font is a decided value — no "var(--whatever)" that isn't defined.
- Aim for 300–500 lines. Clean, readable, production-quality.`,
'product.generate-landing': `
THIS OP — "Generate landing"

Produce kind: "payload" with payload.type: "html".
payload.html is a COMPLETE, SELF-CONTAINED HTML DOCUMENT.
payload.label is a short human title (e.g. "Landing page — v1").
All other payload fields are null.

PAGE STRUCTURE
1. <head> — meta charset + viewport, Google Fonts <link>, inline <style>
2. Nav bar — logo/brand on left, one or two nav links, primary CTA button on right
3. Hero — eyebrow, headline (8-12 words), subhead (1-2 sentences), primary CTA, secondary "learn more" link
4. Feature grid — 3 columns, each: icon (SVG), title (3-5 words), body (1-2 sentences)
5. Social proof — 2-3 testimonial or stat blocks side by side
6. Final CTA — headline + primary button, centered
7. Footer — brand mark, minimal links, copyright

DESIGN SYSTEM (modern defaults — swap when design spec is wired in)
- Palette: primary #2563EB, primary-hover #1E4EDB, surface #FFFFFF, canvas #F9FAFB, text #111827, muted #6B7280, border #E5E7EB
- Font: Inter for everything — <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px
- Radius: 6 / 10 / 16 px (buttons/cards/hero blocks)
- Shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)
- Max content width: 1080px, centered with 24px horizontal padding

RULES
- ONE self-contained HTML document. No external CSS or JS files.
- Inline <style> in <head>. No utility classes. No Tailwind. Write real CSS.
- Real copy from the venture context. No lorem ipsum.
- Mobile responsive: single column under 720px (use @media queries).
- NO <script> tags. NO trackers. Only external resource allowed is the Google Fonts <link>.
- Every color, spacing, and font is a decided value — no "var(--whatever)" that isn't defined.
- Aim for 300–500 lines. Clean, readable, production-quality.`,

  // ─────────────────────────────────────────────────────────
  'campaigns.draft-email': `
THIS OP — "Draft email"

Produce kind: "payload" with payload.type: "html".
payload.html is a COMPLETE, SELF-CONTAINED HTML DOCUMENT suitable for an email.
payload.label is a short human title (e.g. "Welcome email — v1").
All other payload fields are null.

EMAIL STRUCTURE
1. Single-column, max-width 600px, centered, 24px padding
2. Header — brand name in muted caps, small
3. Body — 2–4 short paragraphs, one job per paragraph
4. Primary CTA — a single accent button with a specific label (not "Click here")
5. Sign-off — founder name, one-liner
6. Footer — physical address (placeholder), unsubscribe link (placeholder)

DESIGN SYSTEM
- Palette: primary #2563EB, surface #FFFFFF, canvas #F9FAFB, text #111827, muted #6B7280, border #E5E7EB
- Font: Inter or system-sans (email clients vary — declare both)
- Body: 16px / 1.6 line-height
- Button: padding 12px 20px, radius 8px, no box-shadow (email clients strip it)
- Dark mode fallback in @media (prefers-color-scheme: dark)

RULES
- ONE self-contained HTML document. All CSS inline in a <style> block.
- No external CSS files. No <script> tags. No tracking pixels. No <img src> from unknown hosts.
- Real copy from the venture context — the recipient, the trigger, the goal.
- Table-based layout where email clients require it; flexbox where they support it.
- Aim for 150–250 lines. Clean, deliverable, production-quality.`,

  // ─────────────────────────────────────────────────────────
  'engineering.generate-ui-spec': `
THIS OP — "Generate UI spec"

Produce kind: "payload" with payload.type: "html".
payload.html is a COMPLETE, SELF-CONTAINED HTML DOCUMENT — a component gallery.
payload.label is a short human title (e.g. "UI spec — v1").
All other payload fields are null.

PAGE STRUCTURE
1. <head> — meta tags, Google Fonts <link>, inline <style>
2. Page header — "UI system · [Product name]", short subhead, palette swatch row
3. Typography scale — display heading, h1, h2, h3, body, small, all labeled
4. Button gallery — Primary / Secondary / Ghost, each shown in Default / Hover (simulated) / Disabled states, side by side
5. Input gallery — Text input, textarea, select, checkbox — each in Default / Focus / Filled / Disabled
6. Card gallery — Base card, feature card, alert (info/success/warning/error)
7. Empty state + loading state + error state — three side-by-side panels
8. Component specs table — component, tokens used, states supported

DESIGN SYSTEM (modern defaults)
- Palette: primary #2563EB, surface #FFFFFF, canvas #F9FAFB, text #111827, muted #6B7280, border #E5E7EB, success #16A34A, warning #D97706, error #DC2626
- Font: Inter
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
- Radius: 6 / 10 / 16 / 999 px (button/input/card/pill)
- Shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)

RULES
- ONE self-contained HTML document. Inline <style>. Real CSS.
- Every component shown in every state — Default, Hover, Focus, Disabled, Empty, Loading, Error.
- Real examples with realistic copy, not "Lorem ipsum" or "Sample text".
- Grid layout for galleries: 3-up on desktop, 1-up on mobile.
- NO <script> tags. NO trackers. Only Google Fonts external.
- Aim for 400–700 lines. A designer should be able to hand this to a dev.`,

  // ─────────────────────────────────────────────────────────
  'strategy.generate-brand-brief': `
THIS OP — "Generate brand brief"

Produce kind: "payload" with payload.type: "text".
payload.slides is an array of 11-13 slides.
payload.label = "Brand brief — [venture name]".
All other payload fields are null.

Every slide: { eyebrow, title, body, bullets, metric }.
- eyebrow: 1-2 word section tag
- title: 5-8 word thesis (never shorter, never generic)
- body: 2-4 sentences OR null when bullets carry the weight
- bullets: 3-5 specific items OR null when body carries the weight
- metric: { label, value } for stat slides, else null

SLIDE ARC — 11 slides minimum

1.  Cover — eyebrow "Brand brief", title "[Venture name] — the brand", body one sentence naming what this company is and who it is for, grounded in the positioning draft.
2.  The promise — title 6-8 words. body 2-3 sentences: what we promise and what we refuse to promise.
3.  Audience — title 5-7 words naming the buyer, drawn from ICP. bullets: 3 truths about this audience, each drawn from ICP context, not generic.
4.  Tone of voice — title 6-8 words naming the voice. body 2-3 sentences. bullets: 3 tone rules, each specific enough to act on.
5.  The enemy — title 5-7 words naming what we are against. body 2-3 sentences: the industry norm we reject.
6.  Visual language — title 6-8 words naming the aesthetic. body 2-3 sentences. Reference two real products whose aesthetic we borrow from.
7.  Palette — title 5-7 words. bullets: 4-5 items, each "HEX · usage" — real 6-digit hex codes.
8.  Typography — title 5-7 words. bullets: 3 items, each "family · weights · use" — real Google Fonts or system fonts.
9.  Signature moves — title 5-7 words. bullets: 3 moves specific enough that a designer could implement them.
10. Reference sites — title 5-7 words. bullets: 3 real products with a specific borrow point each.
11. What we are not — title 5-7 words. bullets: 3 things we would never do.

RULES
- Real hex codes. Real font names. Real references.
- Every bullet is falsifiable — a specific claim, not an adjective.
- If VENTURE DESIGN SPEC is present in input, Palette + Typography MUST reflect its tokens.`,

  // ─────────────────────────────────────────────────────────
  'funding.build-pitch-deck': `
THIS OP — "Build pitch deck"

Produce kind: "payload" with payload.type: "text".
payload.slides is an array of 12-14 slides.
payload.label = "Pitch deck — [venture name] · [Stage]".
All other payload fields are null.

Every slide: { eyebrow, title, body, bullets, metric }.
- title: 5-9 words, specific thesis
- body: 2-4 sentences. The argument, not marketing.
- bullets: 3-5 items when list-shaped, else null.
- metric: { label, value } for quantitative slides, else null.

SLIDE ARC — investor narrative, 12 slides minimum

1.  Cover — venture name + one-line positioning (8-12 words).
2.  Problem — the specific pain, with a real number if possible.
3.  Insight — the non-obvious truth this company is built on.
4.  Solution — the product, described in the customer words.
5.  Product — one screen or flow, described. Not "features".
6.  Market — metric slide: TAM, SAM, SOM with real dollar figures.
7.  Business model — how money moves, pricing shape, gross margin.
8.  Traction — metric slide: ARR / users / retention, real numbers.
9.  Competition — name 2-3 real competitors, one clean wedge.
10. GTM — primary channel, why it works, expected CAC.
11. Team — founders, why them, one specific credential each.
12. The ask — raise size, use of funds (3 bullets), 18-month goal.

RULES
- Every metric slide shows a real number. "$X" fails.
- Every competitor slide names real companies.
- Every team slide has real names and one relevant credential each.
- No hockey-stick projections.`,

  // ─────────────────────────────────────────────────────────
  'engineering.draft-api-spec': `
THIS OP — "Draft API spec"

Produce kind: "payload" with payload.type: "text".
payload.language = "yaml" (OpenAPI 3.1) or "typescript" (interface-first).
Choose TypeScript if the venture is early-stage and the spec is for one team.
Choose OpenAPI if this is an external or partner API.
payload.code = the COMPLETE spec as a single string, no markdown fences.
payload.label = "[Venture name] API — v1".
All other payload fields are null.

SPEC REQUIREMENTS — OpenAPI
- openapi: 3.1.0
- info.title, info.version (1.0.0), info.description (2 sentences)
- servers with a real production URL
- Every path under /api/v1/
- For each endpoint: operationId, summary, tags, requestBody (schema + example), responses 200/400/401/404
- components.schemas for every type, with example values
- components.securitySchemes with bearer auth

SPEC REQUIREMENTS — TypeScript
- Leading comment block: 3-5 lines on auth model, base URL, rate limits
- Named, exported interfaces for every request and response type
- One typed function per endpoint: (input) => Promise<Output>
- Error shapes: type ApiError = { code: string; message: string }
- Field names drawn from venture context. If ceramics: Glaze, KilnProfile, FiringRun — not Item, Record.

DOMAIN INJECTION
- The spec MUST be for THIS venture's domain. If the venture is "AI pottery design", endpoints include /designs, /glazes, /kiln-profiles. If the venture is "biotech compliance", endpoints include /studies, /submissions, /audit-logs.
- Field names use the venture's vocabulary.

DEPTH
- 250-600 lines of real spec. Not pseudocode, not "// TODO".
- Every field is defined. Every example filled with realistic data.

RULES
- Real, runnable-looking code.
- No placeholders. No "TODO", no "..." in body.
- No markdown fences in payload.code. Just the raw string.
- One artifact — OpenAPI OR TypeScript.`,

  // ─────────────────────────────────────────────────────────
  'funding.build-financial-model': `
THIS OP — "Build financial model"

Produce kind: "payload" with payload.type: "text".
payload.tabs = 4 tab objects { name, columns, rows }.
payload.label = "[Venture name] financial model — v1".
All other payload fields are null.

TABS — exactly these four

1. "Revenue" — columns: ["Month", "Users", "ARPU ($)", "MRR ($)", "Cumulative ($)"]
   · 24 rows: M1 through M24
   · Users grows 8-15% MoM in Y1, decelerating to 4-8% in Y2
   · ARPU is a real number tied to pricing model
   · MRR = Users * ARPU
   · Cumulative = previous + this month MRR

2. "Costs" — columns: ["Month", "Engineering ($)", "Infra ($)", "GTM ($)", "Total ($)"]
   · 24 rows matching Revenue
   · Engineering grows stepwise as headcount adds
   · Infra scales with users ($0.50-$2.00/user/month)
   · GTM tied to CAC from gtm.draft-channel-strategy
   · Total = Engineering + Infra + GTM

3. "P&L" — columns: ["Month", "Revenue ($)", "Costs ($)", "Net ($)", "Cumulative Net ($)"]
   · 24 rows
   · Revenue = MRR from tab 1
   · Costs = Total from tab 2
   · Net = Revenue - Costs
   · Cumulative Net = previous + this month net

4. "Assumptions" — columns: ["Key", "Value", "Source"]
   · 8-12 rows. Every assumption in the model listed here.
   · Examples: "Monthly growth (Y1)" | "12%" | "Channel strategy"; "ARPU" | "$29" | "Pricing — Pro tier"; "CAC" | "$180" | "GTM draft"; "Engineering / person" | "$15,000" | "Market rate"; "Infra / user" | "$0.80" | "SaaS benchmark".

ARITHMETIC RULES — non-negotiable
- Users * ARPU = MRR
- MRR month N = Revenue month N
- Sum of Cost columns = Total
- Net = Revenue - Costs
- Cumulative columns are strictly running sums
- No empty cells. No "TBD". No "X".

RULES
- Conservative by default. A model that assumes 5% of a $100B market in 24 months is not credible.
- The Assumptions tab is where the founder changes the story.`,


  // ─────────────────────────────────────────────────────────

};

function systemPromptForRunOp(opId?: string): string {
  const base = `You are IV's venture agent. You execute ONE operation for a founder's venture and produce its output.

You receive:
- VENTURE: name, description, and (when available) the four Idea Card fields: problem, persona, value, sector.
- OPERATION: verb, description, produces, destination, renderType.
- FOUNDER'S ANSWERS: responses to the op's pre-questions.

Your job: produce the OUTPUT for this operation.

──────────────────────────────────────
OUTPUT SHAPE — one of three kinds
──────────────────────────────────────

1. kind: "snapshot" — for EDITORIAL doc ops (renderType: markdown | deck | sheet | report)
   Snapshot is editorial sections (paragraph, list, callout, metrics, timeline, table, pricing, terms, embed).
   Produce a ShareSnapshot: { title, kicker, sections }
   sections is an array. Each section is one of the ShareSection types.
   4-16 sections. The exact count is dictated by the op's additions below.
   High density. No filler.

   Section types and their shapes:
   - { type: "callout", id, label, callout: { tone: "default"|"attention"|"ready", body } }
   - { type: "paragraph", id, label, paragraph: "…markdown-safe prose…" }
   - { type: "metrics", id, label, metrics: [{ label, value, delta, trend }] }
   - { type: "list", id, label, list: [{ title, body, meta }] }
   - { type: "code", id, label, code: { language, code } }
   - { type: "timeline", id, label, timeline: [{ when, title, body, status }] }
   - { type: "hero", id, label, hero: { eyebrow, headline, subhead, ctaLabel } }
   - { type: "feature-grid", id, label, featureGrid: [{ title, body }] }
   - { type: "pricing", id, label, pricing: [{ name, price, cadence, features, highlighted }] }
   - { type: "terms", id, label, terms: [{ label, body }] }

   ONLY the field matching the section's "type" is populated. Every other field on that section MUST be null.

2. kind: "payload" — for payload-backed ops (renderType: code | html)
   Produce an ActionPayload: { type, label, ... }
   - type: "json" → populate json with a JSON string. Use for tokens, config, structured data.
   - type: "text" → populate text with a markdown string. Use for specs, exports.
   - type: "email" → populate to, subject, body (single-recipient).
   - type: "email_batch" → populate subjectTemplate, bodyTemplate, segments, personalizationRules, estimatedRecipients. Use for OUTBOUND BATCH ops (send outreach, run ICP validation, launch drip). Produce ONE template + segments — NOT 100 individual emails. Use {{placeholders}} like {{firstName}}, {{firmName}}, {{painPhrase}} for per-recipient variation. When the operation's mode is "connected" and the target is a mailing list, use email_batch.
   - type: "html" → populate body with HTML.

3. kind: "confirm" — for operational ops (renderType: operational)
   Produce { heading, body }. heading is 2-4 words. body is 1-2 sentences describing what happened.

4. kind: "action" — for connected execute ops (when operation.mode === 'connected' AND operation.connector is github/vercel/notion/slack/calendar)
   Produce { provider, verb, summary, params }
   - provider: matches operation.connector ('github', 'vercel', 'notion', 'slack', 'calendar')
   - verb: the action name ('create-repo', 'deploy', 'create-page', 'post-message', 'create-event')
   - summary: one line describing the action for the card. e.g. "Create repo iv-platform with 5 files"
   - params: a JSON string containing provider-specific config.

   PROVIDER PARAMS SHAPES:

   github / create-repo:
   {"name": "iv-platform", "description": "...", "private": true,
    "files": [{"path": "README.md", "content": "..."}, ...],
    "issues": [{"title": "...", "body": "..."}, ...]}

   notion / create-page:
   {"parent_page_id": "root", "title": "ICP — Venture Name",
    "markdown": "# ICP\n\n..."}

   slack / post-message:
   {"channel": "#general", "text": "...markdown-ish..."}

   calendar / create-event:
   {"title": "Discovery call", "duration_minutes": 30,
    "description": "..."}

   vercel / deploy:
   {"project_name": "iv-prototype", "files": [{"path": "index.html", "content": "..."}]}

   For github.create-repo, produce a real, complete repo scaffold — README, docs/architecture.md, docs/api.yaml (if op has API spec), and 3-6 issues. Content should be specific to the venture, not generic.
   For notion.create-page, produce markdown — the content is exported as-is.
   For slack.post-message, produce short, informative text under 400 chars.

──────────────────────────────────────
RULES
──────────────────────────────────────
1. Match the operation's verb. If it's "Export requirements", produce requirements — not general strategy.
2. Ground every claim in the venture context. Do NOT invent numbers — use "an estimated", "around", "materially higher" when inferring.
3. No filler. No marketing speak. No exclamation points.
4. If the operation's renderType is "markdown", produce kind: "snapshot" with paragraph + callout + metrics sections. Do NOT produce raw markdown text.
5. If founder answers are provided, respect them — they're constraints, not suggestions.
6. Density over length. Founders read on screens, not paper.
7. Every section id is unique. Use short slugs: "summary", "icp", "wedge", "signals".
8. If the operation renderType is "html", produce kind: "payload" with payload.type: "html".
   payload.html is a complete self-contained HTML document.
   Do NOT produce a snapshot with editorial sections.
   An HTML deliverable is a single HTML file, not a doc.
9. DEPTH FLOOR — every output must be rich, not thin.
   - Sentences per paragraph field: minimum 2. No single-sentence bodies.
   - Bullets per bullet-list: minimum 3.
   - Slide titles: 5-8 words. "Market" fails; "The $4.2B ceramics market is fragmented" passes.
   - Code length: 200+ lines for specs. Half-finished is not acceptable.
   - Every cell in a table is a real value. No "TBD", no dash placeholders.
10. FORBIDDEN PHRASES — these read as filler and are rejected:
    leverage, solution, cutting-edge, innovative, robust, seamless, modern,
    next-generation, next-gen, ecosystem, empower, holistic, synergy,
    streamline, best-in-class, world-class, state-of-the-art, game-changing,
    disruptive, revolutionary, transformative, "at scale" without a number.
    Every claim must be specific and falsifiable.
11. CONCRETENESS RULES:
    - Every name is a real name. "A mid-market compliance buyer at a 500-bed hospital", not "our customer".
    - Every number is a real number. "$2.1M ARR at 40% MoM growth", not "$X ARR".
    - Every quote is in the founder voice, drawn from venture context.
    - Every reference cites its source: ICP draft, positioning, messaging, etc.
12. VENTURE-SPECIFIC, NOT GENERIC — if the venture is biotech, the output is about clinical ops;
    if it is ceramics, the output is about glazes and kilns.
    No template text that could apply to any company.
13. If a VENTURE DESIGN SPEC is provided in the input, every color, font, spacing, and radius
    in your output MUST come from that spec. Do NOT invent new values. If a token is not
    specified, use the fallback defaults in the spec.
`;

  const addition = opId ? OP_PROMPT_ADDITIONS[opId] : null;
  return addition ? base + '\n\n' + addition : base;
}

async function callOpenAI(
  system: string,
  userContent: string,
  schema: object
): Promise<any> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_schema', json_schema: schema },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no content');
  return JSON.parse(content);
}

async function handleRunOp(input: any) {
  const expectedKind = input?.operation?.expectedOutputKind as
    | string
    | undefined;

  const opId = input?.operation?.id as string | undefined;
  const ventureId = input?.venture?.id as string | undefined;

  /* ── Design spec injection ──
   * Four HTML/brand-producing ops read the design system so their
   * output uses the founder's real palette, typography, and spacing
   * — not generic defaults. */
  const DESIGN_CONSUMER_OPS = new Set([
    'product.generate-landing',
    'engineering.generate-ui-spec',
    'campaigns.draft-email',
    'strategy.generate-brand-brief',
  ]);

  let designSpec: any = null;
  if (opId && DESIGN_CONSUMER_OPS.has(opId) && ventureId) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const { data: row } = await admin
      .from('outputs')
      .select('id, title, output_payloads ( snapshot )')
      .eq('venture_id', ventureId)
      .eq('op_id', 'strategy.generate-design-spec')
      .eq('status', 'validated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    designSpec = row?.output_payloads?.[0]?.snapshot ?? null;
    if (designSpec) {
      console.log('[runOp] design spec injected for', opId);
    } else {
      console.log('[runOp] no design spec found for', opId);
    }
  }

  const userContent = JSON.stringify({
    venture: input.venture ?? {},
    operation: input.operation ?? {},
    answers: input.answers ?? {},
    designSpec,
  });

  /* When the op pins its output kind, use a narrowed schema.
     The LLM physically cannot produce the wrong shape. */
  const schema = schemaForExpectedKind(expectedKind);
  return callOpenAI(systemPromptForRunOp(opId), userContent, schema);
}

/* ============================================================
   inquiry — the search agent.
   Reads the venture's knowledge + outputs, calls GPT-4.1 with
   the query + context, persists the answer as a knowledge_entry.
   ============================================================ */

const VENTURE_INSIGHT_SCHEMA = {
  name: 'venture_insight',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      description: { type: 'string' },
      actionLabel: { type: ['string', 'null'] },
      actionOpId: { type: ['string', 'null'] },
      confidence: { type: 'integer' },
    },
    required: ['headline', 'description', 'actionLabel', 'actionOpId', 'confidence'],
    additionalProperties: false,
  },
} as const;

const RUN_OP_NEXT_SCHEMA = {
  name: 'run_op_next',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      question: { type: ['string', 'null'] },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            primary: { type: 'boolean' },
          },
          required: ['label', 'value', 'primary'],
          additionalProperties: false,
        },
      },
      freeText: { type: 'boolean' },
      complete: { type: 'boolean' },
      confirmedLabel: { type: ['string', 'null'] },
    },
    required: ['question', 'options', 'freeText', 'complete', 'confirmedLabel'],
    additionalProperties: false,
  },
} as const;

const INQUIRY_SCHEMA = {
  name: 'inquiry_answer',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      body: { type: 'string' },
      citedEntryIds: {
        type: 'array',
        items: { type: 'string' },
      },
      confidence: { type: 'integer' },
    },
    required: ['title', 'summary', 'body', 'citedEntryIds', 'confidence'],
    additionalProperties: false,
  },
} as const;

function systemPromptForVentureInsight(): string {
  return `You are IV's Intelligence — the founder's in-venture companion.

You receive:
- VENTURE: name, description.
- PAGE: the current venture page (strategy, product, engineering, gtm, campaigns, sales, growth, funding, knowledge, analytics, outcomes, connectors, overview).
- FOCUS: what this page is about.
- DELIVERABLES: validated deliverables on this page, most recent first. Each has { opId, title, createdAt }.
- RUNS: recent runs on this page. Each has { opId, status, createdAt }.
- NEEDS_YOU: runs waiting on founder input.
- GAPS: missing or stale evidence — { kind, opId, label, hint }.
- TOTAL_VALIDATED: total validated deliverables across the venture.

YOUR JOB
Produce ONE short, grounded insight that helps the founder decide what to do next on THIS page. Under 220 characters total.

RULES
1. Base every claim on the provided evidence. Never invent facts.
2. If GAPS contains a "pending_review", lead with that — the founder is already blocked.
3. If GAPS contains a "missing_op", lead with that — a specific op to run.
4. If DELIVERABLES is empty, name the most important op this page needs.
5. If everything is healthy, encourage moving to the NEXT page in the funnel.
6. Prefer specific numbers and op names ("Re-run positioning with the new ICP") over generic advice ("consider strategy").
7. headline: ONE sentence, 6-12 words, concrete.
8. description: 1-2 sentences. Names what evidence drove the insight.
9. actionOpId: the op to run next, e.g. "strategy.define-positioning". Null if no op is suggested.
10. actionLabel: 2-4 word button text, e.g. "Re-run Positioning". Null if no op.
11. confidence: 0-100. Higher when evidence is concrete, lower when inferring.
12. Never use exclamation points. Never use "leverage", "seamless", "robust", "innovative".

Return ONLY the JSON. No preamble.`;
}

function systemPromptForRunOpNext(): string {
  return `You are IV's Venture Op agent. The founder is about to run an operation, and you need enough context first.

You receive:
- VENTURE: name, description, and any validated deliverables (ICP, positioning, wedge, pricing, etc.) already produced.
- OPERATION: verb, description, produces, destination, renderType.
- STANDARD QUESTIONS: the op's baseline questions — treat these as a starting point, not a fixed script.
- EXCHANGES: what the founder has already told you in this session.
- COVERED: signals already covered.
- FOLLOW-UPS REMAINING: how many more questions you may ask (max 5).

YOUR JOB
Ask ONE question under 25 words that would most improve this op's output — OR set complete: true when you have enough.

RULES
1. Prefer the standard questions. They represent information the op genuinely needs.
2. SKIP a standard question if the answer is already in the venture context. If positioning is validated, don't ask what makes them different — you already have it.
3. ADAPT the standard question to this venture's specific context — don't ask "which sector" verbatim if the venture is clearly biotech. Ask about the slice within it.
4. ADD a custom question only when the standard set misses something this venture needs.
5. STOP when you have enough to produce a rich, specific output. Do NOT ask questions just to fill the budget.
6. MANDATORY: every op's Q&A must include at least one FREE-TEXT question where the founder adds real context — a competitor name, a customer story, a proof point, a specific constraint. Options are for categorical choices (sector, tier, cadence). Free text is for what you cannot infer.
7. NEVER ask a free-text question that could be answered with options. If you can enumerate plausible answers, use options instead.
8. NEVER ask an options-only question that could have a "none of the above" or "let me describe" escape. When options don't cover the answer, offer freeText: true alongside options.

QUESTION GUIDELINES
- Concrete, under 25 words.
- Options must be specific to this venture, not generic.
- If a question is genuinely open-ended, set freeText: true and options: [].
- confirmedLabel is a 1-2 word chip (e.g., "Sector", "Firm size", "Tone"). Return null on complete.

When complete, return: { question: null, options: [], freeText: false, complete: true, confirmedLabel: null }

No filler. No "great answer!". No exclamation points.`;
}

function systemPromptForInquiry(): string {
  return `You are IV's venture agent in inquiry mode. A founder has asked a question about their venture. You have access to their knowledge entries (research memos, interviews, insights, selections) and their validated outputs (PRDs, decks, specs, pitches).

Your job: answer the question by synthesizing what's in the context.

RULES
1. Base your answer ONLY on the provided context. Do NOT invent facts.
2. If the context doesn't contain the answer, say so clearly — do not guess.
3. Cite the entry IDs that informed your answer in citedEntryIds.
4. title: a short headline (5-9 words) that answers the question.
5. summary: one sentence (under 160 chars) — the direct answer.
6. body: 3-6 paragraphs of markdown-safe prose. Use bold for key terms. No headers.
7. confidence: 0-100. How well the context answers the question.
8. Tone: direct, founder-facing. No marketing fluff. No exclamation points.

When the question asks "what did X say" or "what do we know about Y", quote or paraphrase the actual content from the context. When it asks "what should we do", synthesize a recommendation grounded in the evidence.`;
}

async function handleInquiry(
  userId: string,
  input: { query: string; ventureId?: string; workspaceId?: string }
) {
  const query = String(input.query ?? '').trim();
  if (!query) return { error: 'missing_query', message: 'Ask a question first.' };

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  /* Fetch context — knowledge entries + validated outputs. */
  let kq = admin
    .from('knowledge_entries')
    .select('id, type, title, summary, content, confidence, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(25);
  if (input.ventureId) kq = kq.eq('venture_id', input.ventureId);

  const { data: entries } = await kq;

  let oq = admin
    .from('outputs')
    .select('id, title, produced_by, render_type')
    .eq('user_id', userId)
    .eq('status', 'validated')
    .order('updated_at', { ascending: false })
    .limit(25);
  if (input.ventureId) oq = oq.eq('venture_id', input.ventureId);

  const { data: outputs } = await oq;

  const context = {
    entries: (entries ?? []).map((e) => ({
      id: e.id,
      kind: e.type,
      title: e.title,
      summary: e.summary ?? '',
      content: (e.content ?? '').slice(0, 3000),
    })),
    outputs: (outputs ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      kind: o.produced_by,
      format: o.render_type,
    })),
  };

  const userContent = JSON.stringify({
    question: query,
    knowledge: context.entries,
    outputs: context.outputs,
  });

  const answer = await callOpenAI(
    systemPromptForInquiry(),
    userContent,
    INQUIRY_SCHEMA
  );

  /* Persist the answer as a knowledge entry. */
  const { data: saved, error: insertErr } = await admin
    .from('knowledge_entries')
    .insert({
      user_id: userId,
      workspace_id: input.workspaceId ?? null,
      venture_id: input.ventureId ?? null,
      type: 'synthesized_answer',
      origin: 'inquiry',
      title: answer.title,
      summary: answer.summary,
      content: answer.body,
      confidence: answer.confidence ?? null,
      contributing_agent: 'research',
      citations: (answer.citedEntryIds ?? []).map((id: string) => ({
        id,
        label: 'Source',
        target: { kind: 'knowledge', entryId: id },
      })),
    })
    .select()
    .single();

  if (insertErr) {
    return {
      error: 'insert_failed',
      message: insertErr.message,
    };
  }

  return {
    entryId: saved.id,
    title: saved.title,
    summary: saved.summary,
    body: saved.content,
    citedEntryIds: answer.citedEntryIds ?? [],
  };
}

/* ============================================================
   Server
   ============================================================ */

async function handleRunOpNext(userId: string, input: any) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  /* ── Gather venture context ──
   * Validated deliverables = the founder's established truths.
   * If we already have an ICP, we don't ask about the sector.
   */
  let outputs: any[] = [];
  if (input.ventureId) {
    const { data } = await admin
      .from('outputs')
      .select('id, title, produced_by, status')
      .eq('user_id', userId)
      .eq('venture_id', input.ventureId)
      .eq('status', 'validated')
      .order('updated_at', { ascending: false })
      .limit(15);
    outputs = data ?? [];
  }

  let ventureInfo: any = null;
  if (input.ventureId) {
    const { data } = await admin
      .from('ventures')
      .select('name, description, health')
      .eq('id', input.ventureId)
      .maybeSingle();
    ventureInfo = data ?? null;
  }

  const userContent = JSON.stringify({
    venture: {
      ...(ventureInfo ?? {}),
      validatedOutputs: outputs.map((o) => ({
        id: o.id,
        title: o.title,
        kind: o.produced_by,
      })),
    },
    operation: input.operation ?? {},
    standardQuestions: input.standardQuestions ?? [],
    exchanges: input.exchanges ?? [],
    covered: input.covered ?? [],
    followUpsRemaining: input.followUpsRemaining ?? 5,
  });

  const result = await callOpenAI(
    systemPromptForRunOpNext(),
    userContent,
    RUN_OP_NEXT_SCHEMA,
  );

  console.log('[runOpNext]', {
    opId: input.operation?.id,
    exchangeCount: (input.exchanges ?? []).length,
    hasQuestion: !!result.question,
    complete: result.complete,
  });

  return result;
}

async function handleVentureInsight(input: any) {
  const userContent = JSON.stringify({
    venture: input.venture ?? {},
    page: input.page ?? 'overview',
    focus: input.focus ?? '',
    deliverables: input.deliverables ?? [],
    runs: input.runs ?? [],
    needsYou: input.needsYou ?? [],
    gaps: input.gaps ?? [],
    totalValidated: input.totalValidated ?? 0,
  });

  const result = await callOpenAI(
    systemPromptForVentureInsight(),
    userContent,
    VENTURE_INSIGHT_SCHEMA,
  );

  console.log('[ventureInsight]', {
    page: input.page,
    hasAction: !!result.actionOpId,
    confidence: result.confidence,
  });

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'not authenticated', retryable: false }),
      {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }

  let body: { method?: string; input?: any };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid JSON', retryable: false }),
      {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }

  const { method, input } = body;
  if (!method || typeof method !== 'string') {
    return new Response(
      JSON.stringify({ error: 'method required', retryable: false }),
      {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    let output: any;
    switch (method) {
      case 'runOp':
        output = await handleRunOp(input);
        break;
      case 'inquiry':
        output = await handleInquiry(userId, input);
        break;
      case 'ventureInsight':
        output = await handleVentureInsight(input);
        break;
      case 'runOpNext':
        output = await handleRunOpNext(userId, input);
        break;
      default:
        return new Response(
          JSON.stringify({
            error: `unknown method: ${method}`,
            retryable: false,
          }),
          {
            status: 400,
            headers: { ...CORS, 'Content-Type': 'application/json' },
          }
        );
    }
    return new Response(JSON.stringify({ output }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    console.error('[venture-agent]', method, message);
    return new Response(
      JSON.stringify({ error: message, retryable: true }),
      {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  }
});
