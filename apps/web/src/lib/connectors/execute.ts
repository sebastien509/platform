import { supabase } from '@/lib/supabase';
import type { ConnectorProvider } from './types';

/* ============================================================
   connector-execute client — the send path.
   ============================================================ */

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  opId?: string;
  threadId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  runId?: string;
  error?: string;
}

export async function sendGmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { data, error } = await supabase.functions.invoke('connector-execute', {
    body: {
      method: 'execute',
      input: {
        provider: 'gmail' as ConnectorProvider,
        action: 'send',
        opId: input.opId,
        threadId: input.threadId,
        payload: {
          to: input.to,
          subject: input.subject,
          body: input.body,
        },
      },
    },
  });

  if (error) return { ok: false, error: error.message };

  const out = data?.output;
  if (out?.error) return { ok: false, error: out.message ?? out.error };

  return {
    ok: true,
    messageId: out.messageId,
    runId: out.runId,
  };
}

/* ============================================================
   Recipient parsing — "email" or "email,firstName,firmName"
   per line, or comma-separated.
   ============================================================ */

export interface ParsedRecipient {
  email: string;
  firstName?: string;
  firmName?: string;
}

export function parseRecipients(raw: string): ParsedRecipient[] {
  const out: ParsedRecipient[] = [];
  const seen = new Set<string>();
  const lines = raw
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    const email = parts[0]?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      firstName: parts[1] || email.split('@')[0],
      firmName: parts[2] || undefined,
    });
  }
  return out;
}

export function renderTemplate(
  template: string,
  recipient: ParsedRecipient,
  fallbacks: Record<string, string> = {}
): string {
  const vars: Record<string, string> = {
    firstName: recipient.firstName ?? recipient.email.split('@')[0],
    firmName: recipient.firmName ?? '',
    senderName: 'Founder',
    ...fallbacks,
  };
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_m, key) => vars[key] ?? ''
  );
}

/* ============================================================
   Generic action executor — one entry point for every
   provider + action pair.
   ============================================================ */

export interface ConnectorActionResult {
  ok: boolean;
  error?: string;
  /** Provider-specific result fields. */
  repoUrl?: string;
  fullName?: string;
  pageUrl?: string;
  pageId?: string;
  eventUrl?: string;
  eventId?: string;
  deployUrl?: string;
  deploymentId?: string;
  ts?: string;
  channel?: string;
  messageId?: string;
  runId?: string;
}

export async function executeConnectorAction(input: {
  provider: string;
  action: string;
  opId?: string;
  threadId?: string;
  outputId?: string;
  payload: Record<string, unknown>;
}): Promise<ConnectorActionResult> {
  const { data, error } = await supabase.functions.invoke('connector-execute', {
    body: {
      method: 'execute',
      input: {
        provider: input.provider,
        action: input.action,
        opId: input.opId,
        threadId: input.threadId,
          outputId: input.outputId,
        payload: input.payload,
      },
    },
  });

  if (error) return { ok: false, error: error.message };

  const out = data?.output;
  if (out?.error) {
    return { ok: false, error: out.message ?? out.error };
  }

  return { ok: true, ...(out ?? {}) };
}

/* Parse the LLM's JSON-string params into an object. */
export function parseActionParams<T = Record<string, unknown>>(
  raw: string
): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ============================================================
   Generic action executor — one entry point for every
   provider + action pair.
   ============================================================ */

export interface ConnectorActionResult {
  ok: boolean;
  error?: string;
  /** Provider-specific result fields. */
  repoUrl?: string;
  fullName?: string;
  pageUrl?: string;
  pageId?: string;
  eventUrl?: string;
  eventId?: string;
  ts?: string;
  channel?: string;
  messageId?: string;
  runId?: string;
}


/* Parse the LLM's JSON-string params into an object. */
