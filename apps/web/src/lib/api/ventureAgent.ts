import { supabase } from '@/lib/supabase';
import type { ShareSnapshot } from '@/lib/share';
import type { ActionPayload } from '@/features/venture-actions/page-actions';

/* ============================================================
   ventureAgent — the client wrapper for the `venture-agent`
   edge function.

   One method: runOp. The caller supplies the op definition +
   venture context + the founder's answers, and receives
   structured output that maps to the op's renderType.
   ============================================================ */

export interface RunOpInput {
  operation: {
    id: string;
    verb: string;
    description?: string;
    produces?: string;
    destination: string;
    renderType?: string;
    surfaceId?: string;
    /** 'native' (in-platform) or 'connected' (external service). */
    mode?: 'native' | 'connected';
    /** When connected: 'gmail', 'postmark', 'github', etc. */
    connector?: string;
    /** Pins the output kind. When set, the edge function narrows
     *  the response schema so the LLM physically cannot return
     *  anything else. */
    expectedOutputKind?: 'snapshot' | 'payload' | 'confirm' | 'email_batch' | 'action';
  };
  venture: {
    id: string;
    name?: string;
    description?: string;
    problem?: string;
    persona?: string;
    value?: string;
    sector?: string;
  };
  pageId: string;
  answers: Record<string, string>;
}

export interface RunOpSnapshotOutput {
  kind: 'snapshot';
  snapshot: ShareSnapshot;
}

export interface RunOpPayloadOutput {
  kind: 'payload';
  payload: ActionPayload;
}

export interface RunOpConfirmOutput {
  kind: 'confirm';
  confirm: { heading: string; body: string };
}

export interface RunOpActionOutput {
  kind: 'action';
  action: {
    provider: string;
    verb: string;
    summary: string;
    /** JSON string of provider-specific params. */
    params: string;
  };
}

export type RunOpOutput =
  | RunOpSnapshotOutput
  | RunOpPayloadOutput
  | RunOpConfirmOutput
  | RunOpActionOutput;

/* The edge function's schema returns all three possible fields,
   only one populated. This normalizes them into a discriminated
   union the caller can switch on. */
interface RawRunOpOutput {
  kind: 'snapshot' | 'payload' | 'confirm' | 'action';
  snapshot?: any | null;
  payload?: any | null;
  confirm?: { heading: string; body: string } | null;
  action?: {
    provider: string;
    verb: string;
    summary: string;
    params: string;
  } | null;
}

function normalizePayload(raw: any): ActionPayload {
  if (!raw) {
    return { type: 'text', label: 'Output', text: '' };
  }
  switch (raw.type) {
    case 'json':
      try {
        return {
          type: 'json',
          label: raw.label ?? 'Data',
          data: raw.json ? JSON.parse(raw.json) : {},
        };
      } catch {
        return {
          type: 'text',
          label: raw.label ?? 'Data',
          text: raw.json ?? '',
        };
      }
    case 'text':
      return {
        type: 'text',
        label: raw.label ?? 'Output',
        text: raw.text ?? '',
      };
    case 'email':
      return {
        type: 'email',
        to: raw.to ?? '',
        subject: raw.subject ?? '',
        body: raw.body ?? '',
      };
    case 'email_batch': {
      const rulesArr = Array.isArray(raw.personalizationRules)
        ? raw.personalizationRules
        : [];
      const rules: Record<string, string> = {};
      for (const r of rulesArr) {
        if (r?.key && r?.source) rules[r.key] = r.source;
      }
      return {
        type: 'email_batch',
        label: raw.label ?? 'Outbound batch',
        batch: {
          subjectTemplate: raw.subjectTemplate ?? '',
          bodyTemplate: raw.bodyTemplate ?? '',
          segments: Array.isArray(raw.segments)
            ? raw.segments.map((s: any) => ({
                name: s.name,
                size: s.size ?? undefined,
                filter: s.filter ?? undefined,
                personalizationHint: s.personalizationHint ?? undefined,
              }))
            : [],
          personalizationRules: rules,
          estimatedRecipients: raw.estimatedRecipients ?? undefined,
        },
      };
    }
    case 'html':
      return {
        type: 'html',
        label: raw.label ?? 'Preview',
        html: raw.body ?? '',
      };
    case 'link':
      return {
        type: 'link',
        label: raw.label ?? 'Link',
        url: raw.url ?? '',
      };
    case 'confirm':
      return {
        type: 'confirm',
        heading: raw.heading ?? 'Done',
        body: raw.body ?? '',
      };
    default:
      return { type: 'text', label: 'Output', text: '' };
  }
}

function normalizeSnapshot(raw: any): ShareSnapshot {
  if (!raw) return { title: 'Output', sections: [] };

  const sections = (raw.sections ?? []).map((s: any, i: number) => {
    const id = s.id ?? `sec-${i}`;
    const label = s.label ?? undefined;

    switch (s.type) {
      case 'paragraph':
        return { type: 'paragraph', id, label, body: s.paragraph ?? '' };
      case 'callout':
        return {
          type: 'callout',
          id,
          label,
          tone: s.callout?.tone ?? 'default',
          body: s.callout?.body ?? '',
        };
      case 'metrics':
        return {
          type: 'metrics',
          id,
          label,
          items: (s.metrics ?? []).map((m: any) => ({
            label: m.label,
            value: m.value,
            delta: m.delta ?? undefined,
            trend: m.trend ?? undefined,
          })),
        };
      case 'list':
        return {
          type: 'list',
          id,
          label,
          items: (s.list ?? []).map((it: any) => ({
            title: it.title,
            body: it.body ?? undefined,
            meta: it.meta ?? undefined,
          })),
        };
      case 'code':
        return {
          type: 'code',
          id,
          label,
          language: s.code?.language ?? undefined,
          code: s.code?.code ?? '',
        };
      case 'timeline':
        return {
          type: 'timeline',
          id,
          label,
          items: (s.timeline ?? []).map((t: any) => ({
            when: t.when,
            title: t.title,
            body: t.body ?? undefined,
            status: t.status ?? undefined,
          })),
        };
      case 'hero':
        return {
          type: 'hero',
          id,
          eyebrow: s.hero?.eyebrow ?? undefined,
          headline: s.hero?.headline ?? '',
          subhead: s.hero?.subhead ?? undefined,
          cta: s.hero?.ctaLabel ? { label: s.hero.ctaLabel } : undefined,
        };
      case 'feature-grid':
        return {
          type: 'feature-grid',
          id,
          label,
          items: (s.featureGrid ?? []).map((f: any) => ({
            title: f.title,
            body: f.body,
          })),
        };
      case 'pricing':
        return {
          type: 'pricing',
          id,
          label,
          tiers: (s.pricing ?? []).map((p: any) => ({
            name: p.name,
            price: p.price,
            cadence: p.cadence ?? undefined,
            features: p.features ?? [],
            highlighted: p.highlighted ?? false,
          })),
        };
      case 'terms':
        return {
          type: 'terms',
          id,
          label,
          items: (s.terms ?? []).map((t: any) => ({
            label: t.label,
            body: t.body,
          })),
        };
      default:
        return {
          type: 'paragraph',
          id,
          label,
          body: 'Unsupported section',
        };
    }
  });

  return {
    title: raw.title ?? 'Output',
    kicker: raw.kicker ?? undefined,
    sections,
  };
}

export interface RunOpNextExchange {
  id: string;
  question: string;
  answer: string;
  confirmedLabel?: string | null;
}

export interface RunOpNextStandardQuestion {
  id: string;
  prompt: string;
  options?: Array<{ label: string; value: string; primary?: boolean }>;
  freeText?: boolean;
}

export interface RunOpNextInput {
  ventureId?: string;
  operation: {
    id: string;
    verb: string;
    description?: string;
    produces?: string;
    destination?: string;
    renderType?: string;
  };
  standardQuestions: RunOpNextStandardQuestion[];
  exchanges: RunOpNextExchange[];
  covered: string[];
  followUpsRemaining: number;
}

export interface RunOpNextOutput {
  question: string | null;
  options: Array<{ label: string; value: string; primary: boolean }>;
  freeText: boolean;
  complete: boolean;
  confirmedLabel: string | null;
}

export async function runOpNext(
  input: RunOpNextInput,
): Promise<RunOpNextOutput> {
  const { data, error } = await supabase.functions.invoke<{
    output: RunOpNextOutput;
    error?: string;
  }>('venture-agent', {
    body: { method: 'runOpNext', input },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.output) throw new Error('empty response from venture-agent');
  return data.output;
}

export async function runOp(input: RunOpInput): Promise<RunOpOutput> {
  const { data, error } = await supabase.functions.invoke('venture-agent', {
    body: { method: 'runOp', input },
  });

  if (error) {
    throw new Error(error.message ?? 'venture-agent failed');
  }

  const raw = data?.output as RawRunOpOutput | undefined;
  if (!raw) throw new Error('venture-agent returned no output');

  switch (raw.kind) {
    case 'snapshot':
      return {
        kind: 'snapshot',
        snapshot: normalizeSnapshot(raw.snapshot),
      };
    case 'payload':
      return {
        kind: 'payload',
        payload: normalizePayload(raw.payload),
      };
    case 'confirm':
      return {
        kind: 'confirm',
        confirm: raw.confirm ?? { heading: 'Done', body: '' },
      };
    case 'action':
      if (!raw.action) throw new Error('action payload missing');
      return {
        kind: 'action',
        action: {
          provider: raw.action.provider,
          verb: raw.action.verb,
          summary: raw.action.summary,
          params: raw.action.params,
        },
      };
    default:
      throw new Error(`unknown kind: ${(raw as any).kind}`);
  }
}
