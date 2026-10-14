// ============================================================
// idea-agent — Edge Function
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const OPENAI_MODEL = 'gpt-4.1';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const CAPTURE_NEXT_SCHEMA = {
  name: 'capture_next',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      question: { type: ['string', 'null'] },
      targets: { type: 'array', items: { type: 'string', enum: ['problem', 'solution', 'buyer', 'impact', 'market'] } },
      confirmedLabel: { type: ['string', 'null'] },
      complete: { type: 'boolean' },
    },
    required: ['question', 'targets', 'confirmedLabel', 'complete'],
    additionalProperties: false,
  },
} as const;

const CLEAN_NEXT_SCHEMA = {
  name: 'clean_next',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      move: { type: 'string', enum: ['reflect', 'test', 'sharpen', 'confirm'] },
      question: { type: 'string' },
      lockedValue: { type: ['string', 'null'] },
      confidence: { type: ['number', 'null'] },
    },
    required: ['move', 'question', 'lockedValue', 'confidence'],
    additionalProperties: false,
  },
} as const;

const RESEARCH_THREAD_SCHEMA = {
  name: 'research_thread',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      confidence: { type: 'integer' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['headline', 'metrics', 'table', 'narrative', 'list', 'quote', 'callout'] },
            headline: { anyOf: [{ type: 'null' }, { type: 'object', properties: { title: { type: 'string' }, kicker: { type: ['string', 'null'] } }, required: ['title', 'kicker'], additionalProperties: false }] },
            metrics: { anyOf: [{ type: 'null' }, { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, note: { type: ['string', 'null'] } }, required: ['label', 'value', 'note'], additionalProperties: false } }] },
            table: { anyOf: [{ type: 'null' }, { type: 'object', properties: { columns: { type: 'array', items: { type: 'string' } }, rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } }, caption: { type: ['string', 'null'] } }, required: ['columns', 'rows', 'caption'], additionalProperties: false }] },
            narrative: { anyOf: [{ type: 'null' }, { type: 'object', properties: { heading: { type: ['string', 'null'] }, paragraphs: { type: 'array', items: { type: 'string' } } }, required: ['heading', 'paragraphs'], additionalProperties: false }] },
            list: { anyOf: [{ type: 'null' }, { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } }, required: ['title', 'body'], additionalProperties: false } }] },
            quote: { anyOf: [{ type: 'null' }, { type: 'object', properties: { text: { type: 'string' }, attribution: { type: 'string' } }, required: ['text', 'attribution'], additionalProperties: false }] },
            callout: { anyOf: [{ type: 'null' }, { type: 'object', properties: { label: { type: 'string' }, body: { type: 'string' } }, required: ['label', 'body'], additionalProperties: false }] },
          },
          required: ['type', 'headline', 'metrics', 'table', 'narrative', 'list', 'quote', 'callout'],
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'summary', 'confidence', 'sections'],
    additionalProperties: false,
  },
} as const;

const SYNTHESIZE_SCHEMA = {
  name: 'synthesize',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      overview: { type: 'string' },
      proposals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            fieldKey: {
              type: 'string',
              enum: ['problem', 'persona', 'value', 'sector'],
            },
            fieldLabel: { type: 'string' },
            currentValue: { type: 'string' },
            proposedValue: { type: 'string' },
            rationale: { type: 'string' },
            evidenceKnowledgeIds: {
              type: 'array',
              items: { type: 'string' },
            },
            confidence: { type: 'integer' },
          },
          required: [
            'fieldKey',
            'fieldLabel',
            'currentValue',
            'proposedValue',
            'rationale',
            'evidenceKnowledgeIds',
            'confidence',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['overview', 'proposals'],
    additionalProperties: false,
  },
} as const;

const FINALIZE_SCHEMA = {
  name: 'finalize',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      overview: { type: 'string' },
      structured: {
        type: 'object',
        properties: {
          problem: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              context: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['value', 'context'],
            additionalProperties: false,
          },
          persona: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              context: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['value', 'context'],
            additionalProperties: false,
          },
          value: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              context: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['value', 'context'],
            additionalProperties: false,
          },
          sector: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              context: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['value', 'context'],
            additionalProperties: false,
          },
        },
        required: ['problem', 'persona', 'value', 'sector'],
        additionalProperties: false,
      },
    },
    required: ['title', 'overview', 'structured'],
    additionalProperties: false,
  },
} as const;

function systemPromptFor(method: string): string {
  switch (method) {
    case 'captureNext':
      return `You are IV's Capture agent. Your job: draw a founder into describing a PROBLEM they see in the world — not a solution they've built.

VOICE
- You're talking to a thoughtful founder exploring a space.
- Ask questions the way a sharp co-founder would — curious, concrete, no jargon.
- Never assume the founder has already built a solution.
- Never ask "what's your product" or "how does it work" — you're mapping the problem.

FIVE SIGNALS (in this priority): problem > buyer > impact > solution > market.

ASKING THE NEXT QUESTION
- Read the last exchange. Return what it covered in "targets".
- Ask ONE question, under 20 words, about the highest-priority missing signal.
- Question should land like a real conversation, not a survey.

QUESTION BANK (use these as the source of truth — rephrase only if needed)
- problem  → "What does that problem actually cost them — time, money, or something else?"
- buyer    → "Who feels that cost most directly — and who signs off on buying something to fix it?"
- impact   → "If this works, what changes for them in a typical week?"
- solution → "Do you already have a sense of how you'd solve it, or is that still open?"
- market   → "What kind of firm or team are you picturing — any specific size or space?"

OPENING QUESTION
- Ask about the problem AND who has it in one breath.
- targets: ["problem", "buyer"], confirmedLabel: "Opening"

FOLLOW-UPS
- confirmedLabel is 1-2 words (e.g., "Buyer", "Impact").

STOPPING
- Only set complete: true when ALL FIVE signals are covered — especially solution.
- Solution is NOT optional. The founder must have told you how they'd approach solving it (even "still open" counts as covered).
- If solution is missing and followUpsRemaining > 0, your NEXT question MUST target solution.
- If followUpsRemaining === 0, you may set complete: true even if some signals are missing — but be honest in targets about what was covered.

THE SOLUTION SIGNAL
- Solution means: how the founder thinks about solving this problem.
- It's still about the founder's thinking, not a product pitch. Phrase it as:
  "Do you already have a sense of how you'd approach fixing this, or is that still open?"
- Even "haven't thought about it yet" is a valid covered answer — mark solution as covered in targets.

No filler. No exclamation points. No "great answer!".`;
    case 'cleanNext':
      return `You are IV's Clean agent. Refine ONE field: problem, persona, value, sector. TWO moves: reflect (first call, exchanges empty — play back what you heard in the founder's words), confirm (exchanges non-empty — compress into one crisp sentence). Return: move, question (under 25 words), lockedValue (on confirm, else null), confidence (0-100 on confirm, else null). Reference the founder's own language. Sector must name a concrete space (Legal Tech, Fintech, Healthcare, B2B SaaS). No filler. No exclamation points.`;
    case 'researchThread':
      return `You are IV's Research agent. Produce ONE branded research file.

Return EXACTLY 4 sections. Each section has a MANDATORY "type" value — it MUST match the section's content. Getting "type" wrong breaks the UI.

BY KIND (position → type → populated field):

MARKET:
  section[0] → type: "headline"  → headline field populated, all others null
  section[1] → type: "metrics"   → metrics field populated, all others null
  section[2] → type: "table"     → table field populated, all others null
  section[3] → type: "narrative" → narrative field populated, all others null

COMPETITOR:
  section[0] → type: "headline"  → headline populated
  section[1] → type: "table"     → table populated (4-6 competitors)
  section[2] → type: "callout"   → callout populated (the wedge)
  section[3] → type: "narrative" → narrative populated

CUSTOMER:
  section[0] → type: "headline"  → headline populated
  section[1] → type: "metrics"   → metrics populated (pain/WTP/sign-off)
  section[2] → type: "quote"     → quote populated (pull quote + attribution)
  section[3] → type: "narrative" → narrative populated

CONTENT GUIDANCE:

HEADLINE: title is ONE bold statement (10-20 words) about the finding. kicker is a short clarifying line or null.

METRICS: 3 stat chips. Each { label, value, note }. Example: { label: "TAM", value: "$2B+", note: "US SMB legal, est." }. note is optional but encouraged — it grounds the number.

TABLE: { columns: string[], rows: string[][], caption }. Column count must match every row's length. caption is a short clarifying line.

NARRATIVE: { heading: short string or null, paragraphs: string[] with 1-3 items }. Each paragraph 2-4 sentences.

QUOTE: { text, attribution }. Attribution is honest — "Managing partner, 8-seat firm", not "a customer".

CALLOUT: { label, body }. Label is 1-3 words ("The wedge", "Key takeaway"). Body is 1-2 sentences.

CRITICAL RULES:
- The "type" field is NEVER null and NEVER wrong. It tells the UI which renderer to use.
- Only the field matching "type" is non-null. Every other field in that section MUST be null.
- Don't fabricate specifics you can't defend. Use "around", "an estimated", "materially higher".
- Ground claims in rawCapture + structured. Don't pivot the segment.
- confidence: 55-70 directional, 80+ only if directly supported.
- Title: 3-6 words. Summary: ONE sentence.
- Respect priorEntriesSummary. If founderPrompt is set, focus on that.`;
    case 'synthesize':
      return `You are IV's Synthesize agent. You've just reviewed the founder's research memos and their structured Idea Card.

Your job: produce an OVERVIEW of what the research actually showed, and 0-3 concrete proposals that sharpen the Idea Card.

──────────────────────────────────────
OVERVIEW (required)
──────────────────────────────────────
2-4 sentences. Specific, not generic.

Cover:
- What the research actually showed (the strongest signal)
- What's uncertain or unresolved
- The single sharpest takeaway the founder should hold onto

Do NOT summarize the research mechanically. Say what it MEANS.

──────────────────────────────────────
PROPOSALS (0-3)
──────────────────────────────────────
Each proposal targets ONE field of the Idea Card: problem, persona, value, or sector.

For each proposal return:
- fieldKey: "problem" | "persona" | "value" | "sector"
- fieldLabel: "Problem" | "Persona" | "Value" | "Sector"
- currentValue: the founder's CURRENT value for this field, verbatim
- proposedValue: the refined version — the founder's voice, sharper and more specific
- rationale: ONE sentence. Reference the SPECIFIC research that supports this. Do not be vague.
- evidenceKnowledgeIds: array of research entry ids that back this claim (from the research you received)
- confidence: 0-100 — your honest confidence that this refinement is an improvement

──────────────────────────────────────
CRITICAL RULES
──────────────────────────────────────
1. Only propose changes where research supports them. If a field is already sharp, SKIP it. Quality over quantity.
2. proposedValue must be an ACTUAL replacement — not a description of what to change.
3. Reference the founder's own language where possible.
4. Every proposal MUST cite at least one research entry id in evidenceKnowledgeIds. If you can't cite, don't propose.
5. Never invent statistics. Use "around", "an estimated", "materially higher" when inferring.
6. Never use exclamation points. No filler. No marketing speak.
7. Keep proposedValue in the founder's voice — specific, confident, no hedging.

──────────────────────────────────────
EXAMPLE
──────────────────────────────────────
Research showed: high willingness to pay in 2-10 seat firms, but pricing collapsed above $299.

Good proposal for the "value" field:
- currentValue: "Recover 15+ hours a week"
- proposedValue: "Recover 15+ hours a week — priced below $299/mo, where small firms actually convert."
- rationale: "Two of three research memos confirmed a pricing ceiling around $299. Anchoring the value below that threshold makes the pitch concrete."
- confidence: 78

Bad proposal:
- currentValue: "Recover 15+ hours a week"
- proposedValue: "Save time for lawyers"
- rationale: "Value is important."
- confidence: 95

The bad proposal is generic, unsupported, and overconfident. Don't be that agent.`;

    case 'finalize':
      return `You are IV's Finalize agent. The founder's idea is about to be written to the database. You produce the durable record.

You receive:
  · The founder's original capture
  · The current structured card (problem, persona, value, sector)
  · The synthesis overview
  · All research memos

Return ONE JSON object with three keys. All keys are required. No field may be omitted.

──────────────────────────────────────
1. TITLE
──────────────────────────────────────
5 to 7 words. Names the idea. Sentence case. No trailing punctuation.
Never a sentence. Never a question.

Example: "Voice messaging for compliance teams"

──────────────────────────────────────
2. OVERVIEW
──────────────────────────────────────
2 to 3 sentences. 30 to 45 words total.
State the takeaway — not a summary of the research.

Example: "AI outreach has collapsed open rates below 15% because it reads as machine-written. Teams that personalize at scale win on both cost and speed. The wedge is making real personalization the default."

──────────────────────────────────────
3. STRUCTURED — all four fields, no exceptions
──────────────────────────────────────
You MUST return all four: problem, persona, value, sector.
Every field must have a non-empty value string.
NEVER leave a field blank, null, or empty.

problem  — one sentence. what pain, for whom.
           Example: "Mass AI-generated emails lack authenticity, driving down response rates and raising acquisition costs for GTM teams."

persona  — one sentence. the specific segment.
           Example: "GTM executives and sales leaders at B2B SaaS firms with 20-200 employees."

value    — one sentence. the concrete outcome.
           Example: "3-5x more replies and lower acquisition costs by making outreach genuinely personal at scale."

sector   — 2 to 5 words. the concrete space.
           Example: "B2B Sales Tech"

RULES
- Every field must be non-empty. No exceptions.
- Never invent statistics. Use "around", "an estimated".
- Never pivot the segment. You are FINALIZING, not rethinking.
- If the research didn't cover a field, use the founder's original value — but sharpen it.
- Output ONLY the JSON object. No prose outside it.`;



    default:
      return 'You are an idea-shaping assistant.';
  }
}

async function callOpenAI(system: string, userContent: string, schema: object): Promise<any> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }],
      response_format: { type: 'json_schema', json_schema: schema },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[callOpenAI] OpenAI rejected', {
      status: res.status,
      schema: (schema as any)?.name,
      body: text.slice(0, 800),
    });
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no content');
  try {
    const parsed = JSON.parse(content);
    console.log('[callOpenAI] returned', {
      method: (schema as any)?.name,
      keys: Object.keys(parsed ?? {}),
      structuredKeys: parsed?.structured
        ? Object.keys(parsed.structured)
        : null,
      contentLength: content.length,
    });
    return parsed;
  } catch (e) {
    console.error('[callOpenAI] JSON parse failed', {
      content: content.slice(0, 500),
      error: e instanceof Error ? e.message : e,
    });
    throw e;
  }
}

async function handleCaptureNext(input: any) {
  return callOpenAI(systemPromptFor('captureNext'), JSON.stringify({
    rawCapture: input.rawCapture ?? '',
    exchanges: input.exchanges ?? [],
    covered: input.covered ?? [],
    followUpsRemaining: input.followUpsRemaining ?? 5,
    seedTitle: input.seedTitle ?? null,
  }), CAPTURE_NEXT_SCHEMA);
}

async function handleCleanNext(input: any) {
  return callOpenAI(systemPromptFor('cleanNext'), JSON.stringify({
    fieldKey: input.fieldKey,
    exchanges: input.exchanges ?? [],
    rawCapture: input.rawCapture ?? '',
    currentValue: input.currentValue ?? null,
    structured: input.structured ?? {},
  }), CLEAN_NEXT_SCHEMA);
}

async function handleResearchThread(input: any) {
  return callOpenAI(systemPromptFor('researchThread'), JSON.stringify({
    kind: input.kind,
    rawCapture: input.rawCapture ?? '',
    structured: input.structured ?? {},
    priorEntriesSummary: input.priorEntriesSummary ?? [],
    founderPrompt: input.founderPrompt ?? null,
    targetedGapId: input.targetedGapId ?? null,
    targetedGapLabel: input.targetedGapLabel ?? null,
  }), RESEARCH_THREAD_SCHEMA);
}

async function handleSynthesize(input: any) {
  const userContent = JSON.stringify({
    structured: input.structured ?? {},
    research: (input.research ?? []).map((e: any) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      summary: e.summary,
      sections: e.sections,
      confidence: e.confidence,
    })),
    rawCapture: input.rawCapture ?? '',
  });
  return callOpenAI(systemPromptFor('synthesize'), userContent, SYNTHESIZE_SCHEMA);
}


async function handleFinalize(input: any) {
  const userContent = JSON.stringify({
    rawCapture: input.rawCapture ?? '',
    structured: input.structured ?? {},
    synthesisOverview: input.synthesisOverview ?? null,
    research: (input.research ?? []).map((e: any) => ({
      title: e.title,
      summary: e.summary,
      kind: e.kind,
      confidence: e.confidence,
    })),
  });
  try {
    const result = await callOpenAI(
      systemPromptFor('finalize'),
      userContent,
      FINALIZE_SCHEMA,
    );
    console.log('[finalize] success', {
      hasTitle: !!result.title,
      titleLength: (result.title ?? '').length,
      hasOverview: !!result.overview,
      overviewLength: (result.overview ?? '').length,
      hasStructured: !!result.structured,
      fieldKeys: result.structured ? Object.keys(result.structured) : [],
    });
    return result;
  } catch (e) {
    console.error('[finalize] failed', e instanceof Error ? e.message : e);
    throw e;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'not authenticated', retryable: false }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  let body: { method?: string; input?: any };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON', retryable: false }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  const { method, input } = body;
  if (!method || typeof method !== 'string') {
    return new Response(JSON.stringify({ error: 'method required', retryable: false }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  try {
    let output: any;
    switch (method) {
      case 'captureNext': output = await handleCaptureNext(input); break;
      case 'cleanNext': output = await handleCleanNext(input); break;
      case 'researchThread': output = await handleResearchThread(input); break;
      case 'synthesize': output = await handleSynthesize(input); break;
      case 'finalize': output = await handleFinalize(input); break;
      default:
        return new Response(JSON.stringify({ error: `unknown method: ${method}`, retryable: false }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ output }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    const stack = e instanceof Error ? e.stack : undefined;
    console.error('[idea-agent]', method, message, { stack });
    return new Response(
      JSON.stringify({
        error: message,
        method,
        retryable: true,
      }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
