import { supabase } from '@/lib/supabase';
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
import { IdeaAgentError } from './types';
import type { FinalizeInput, FinalizeOutput } from './types';

/* ============================================================
   openaiAgent — client-side implementation of IdeaAgent.

   Every method delegates to the `idea-agent` Edge Function,
   which holds the OpenAI key server-side. The client never
   touches the raw OpenAI API.

   Same interface as mockAgent. The rail never knows which
   one it's talking to.
   ============================================================ */

interface InvokeResult<T> {
  output?: T;
  error?: string;
  retryable?: boolean;
}

async function invoke<T>(
  method: string,
  input: unknown
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<InvokeResult<T>>(
    'idea-agent',
    {
      body: { method, input },
    }
  );

  if (error) {
      /* Supabase's invoke discards the response body on non-2xx.
       * The real error lives inside `error.context`, which is a
       * Response object. Read it so we surface the edge function's
       * actual message instead of the generic wrapper. */
      let detail = error.message ?? 'Edge Function returned a non-2xx status code';
      let bodyText: string | null = null;

      const ctx = (error as any).context;
      if (ctx) {
        try {
          /* Response object — read as text, then try JSON */
          if (typeof ctx.text === 'function') {
            bodyText = await ctx.clone().text();
          } else if (typeof ctx.json === 'function') {
            const j = await ctx.json();
            bodyText = JSON.stringify(j);
          }
          if (bodyText) {
            try {
              const parsed = JSON.parse(bodyText);
              detail = parsed.error || parsed.message || bodyText;
            } catch {
              detail = bodyText.slice(0, 400);
            }
          }
        } catch {
          /* context not readable — fall through to generic */
        }
      }

      console.error('[invoke] edge function failed', {
        method,
        detail,
        bodyText: bodyText?.slice(0, 800),
        rawError: error,
      });

      throw new IdeaAgentError(detail, true);
    }

  if (data?.error) {
    throw new IdeaAgentError(data.error, data.retryable ?? true);
  }

  if (!data?.output) {
    throw new IdeaAgentError('empty response from idea-agent', true);
  }

  return data.output;
}

export const openaiAgent: IdeaAgent = {
  async captureNext(input: CaptureNextInput): Promise<CaptureNextOutput> {
    // onToken is not used yet — the Edge Function returns the full
    // question at once. Streaming lands in a follow-up batch by
    // switching to SSE. The interface stays identical.
    return invoke<CaptureNextOutput>('captureNext', {
      rawCapture: input.rawCapture,
      exchanges: input.exchanges,
      covered: input.covered,
      followUpsRemaining: input.followUpsRemaining,
      seedTitle: input.seedTitle,
    });
  },

  async cleanNext(input: CleanNextInput): Promise<CleanNextOutput> {
    return invoke<CleanNextOutput>('cleanNext', {
      fieldKey: input.fieldKey,
      exchanges: input.exchanges,
      rawCapture: input.rawCapture,
      currentValue: input.currentValue,
      structured: input.structured,
    });
  },

  async researchThread(
    input: ResearchThreadInput
  ): Promise<ResearchThreadOutput> {
    /* The Edge Function returns the entry flat: { title, summary,
       confidence, sections }. The interface expects it wrapped in
       { entry: {...} }. We wrap here so the client-side interface
       stays identical between mock and real implementations. */
    const flat = await invoke<{
      title: string;
      summary: string;
      confidence: number;
      sections: any[];
    }>('researchThread', {
      kind: input.kind,
      rawCapture: input.rawCapture,
      structured: input.structured,
      priorEntriesSummary: input.priorEntriesSummary,
      founderPrompt: input.founderPrompt,
      targetedGapId: input.targetedGapId,
      targetedGapLabel: input.targetedGapLabel,
    });

    return {
      entry: {
        kind: input.kind,
        title: flat.title,
        summary: flat.summary,
        confidence: flat.confidence,
        sections: flat.sections,
        founderPrompt: input.founderPrompt,
      },
    };
  },

  async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
    const raw = await invoke<{
      overview: string;
      proposals: Array<{
        fieldKey: 'problem' | 'persona' | 'value' | 'sector';
        fieldLabel: string;
        currentValue: string;
        proposedValue: string;
        rationale: string;
        evidenceKnowledgeIds: string[];
        confidence: number;
      }>;
    }>('synthesize', {
      structured: input.structured,
      research: input.research,
      rawCapture: input.rawCapture,
    });

    return {
      overview: raw.overview,
      proposals: (raw.proposals ?? []).map((p) => ({
        fieldKey: p.fieldKey,
        fieldLabel: p.fieldLabel,
        currentValue: p.currentValue,
        proposedValue: p.proposedValue,
        rationale: p.rationale,
        evidenceKnowledgeIds: p.evidenceKnowledgeIds,
        confidence: p.confidence,
      })),
    };
  },

  async finalize(input: FinalizeInput): Promise<FinalizeOutput> {
    const raw = await invoke<{
      title: string;
      overview: string;
      structured: {
        problem: { value: string; context: string[] };
        persona: { value: string; context: string[] };
        value: { value: string; context: string[] };
        sector: { value: string; context: string[] };
      };
    }>('finalize', {
      structured: input.structured,
      synthesisOverview: input.synthesisOverview,
      research: input.research,
      rawCapture: input.rawCapture,
    });

    const fields = ['problem', 'persona', 'value', 'sector'] as const;
    const structured = { ...input.structured };

    for (const key of fields) {
      const s = raw.structured?.[key];
      const existing = input.structured[key];
      const llmValue = s?.value?.trim() ?? '';
      const llmContext = Array.isArray(s?.context)
        ? s.context.filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 2)
        : [];
      const existingValue = existing?.value?.trim() ?? '';

      if (!llmValue) {
        console.warn(`[finalize] LLM omitted "${key}" — using fallback`);
      }

      structured[key] = {
        id: existing?.id ?? key,
        key,
        label: existing?.label ?? key.charAt(0).toUpperCase() + key.slice(1),
        value: llmValue || existingValue || '',
        headline: existing?.headline,
        metrics: existing?.metrics,
        context: llmContext.length > 0 ? llmContext : existing?.context,
        status: 'confirmed',
      };
    }

    return {
      title: raw.title?.trim() || 'Idea',
      overview: raw.overview?.trim() || '',
      structured,
    };
  },
};
