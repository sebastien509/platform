import { supabase } from '@/lib/supabase';
import type { ConnectorProvider } from './types';

/* ============================================================
   OAuth / install driver.
   ============================================================ */

export interface StartConnectResult {
  consentUrl: string;
  state: string;
}

function callbackUrl(): string {
  if (typeof window === 'undefined') return '/connectors/callback';
  return `${window.location.origin}/connectors/callback`;
}

export async function startConnect(
  provider: ConnectorProvider,
  options: { returnTo?: string } = {}
): Promise<StartConnectResult | { error: string }> {
  console.log('[connector] start', provider);
  const { data, error } = await supabase.functions.invoke('connector-oauth', {
    body: {
      method: 'start',
      input: {
        provider,
        redirectUri: callbackUrl(),
        returnTo: options.returnTo,
      },
    },
  });

  if (error) {
    console.error('[connector] start invoke error', error);
    return { error: error.message };
  }
  const out = data?.output;
  if (out?.error) {
    console.error('[connector] start output error', out);
    return { error: out.message ?? out.error };
  }
  console.log('[connector] start ok', out);
  return { consentUrl: out.consentUrl, state: out.state };
}

/* Hard timeout wrapper — Supabase's invoke doesn't accept an
   AbortSignal, so we race against a timer instead. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

export async function handleCallback(input: {
  state: string;
  code?: string;
  installationId?: string;
}): Promise<
  | { ok: true; provider?: string; returnTo?: string }
  | { ok: false; error: string }
> {
  console.log('[connector] callback payload', input);

  try {
    const res = await withTimeout(
      supabase.functions.invoke('connector-oauth', {
        body: {
          method: 'callback',
          input: {
            state: input.state,
            code: input.code,
            installationId: input.installationId,
          },
        },
      }),
      25_000,
      'connector-oauth callback'
    );

    console.log('[connector] callback response', res);

    if (res.error) {
      /* supabase-js wraps non-2xx into `.error` with a text
         message. Log the raw context so we can see the actual
         HTTP status + body. */
      console.error('[connector] callback invoke error', {
        message: res.error.message,
        name: (res.error as any).name,
        context: (res.error as any).context,
      });
      return {
        ok: false,
        error: res.error.message ?? 'Invoke failed',
      };
    }

    const out = res.data?.output;
    console.log('[connector] callback output', out);

    if (out?.error) {
      return { ok: false, error: out.message ?? out.error };
    }

    return { ok: true, provider: out?.provider, returnTo: out?.returnTo };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[connector] callback threw', e);
    return { ok: false, error: msg };
  }
}

export async function disconnectConnector(
  provider: ConnectorProvider
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('connector-oauth', {
    body: { method: 'disconnect', input: { provider } },
  });
  if (error) return { ok: false, error: error.message };
  const out = data?.output;
  if (out?.error) return { ok: false, error: out.message ?? out.error };
  return { ok: true };
}
