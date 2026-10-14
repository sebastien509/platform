import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { handleCallback } from '@/lib/connectors/oauth';

/* ============================================================
   ConnectorCallbackPage — the OAuth / install landing.

   Two shapes, differentiated by query params:

     OAuth flow (Gmail):
       ?code=...&state=gmail_xxx

     Install flow (GitHub App):
       ?installation_id=...&setup_action=install&state=github_xxx

   Guarded against StrictMode double-fire using sessionStorage,
   which survives the mount/unmount cycle that a useRef doesn't.

   If the exchange fails, the founder sees the error + a retry
   button instead of an infinite spinner.
   ============================================================ */

type ViewState =
  | { status: 'pending' }
  | { status: 'ok'; provider?: string }
  | { status: 'error'; message: string };

interface Params {
  code?: string;
  installationId?: string;
  state?: string;
  providerError?: string;
}

function readParams(p: URLSearchParams): Params {
  return {
    code: p.get('code') ?? undefined,
    installationId: p.get('installation_id') ?? undefined,
    state: p.get('state') ?? undefined,
    providerError:
      p.get('error_description') ?? p.get('error') ?? undefined,
  };
}

function guardKey(params: Params): string {
  /* One-shot guard keyed by the state token — a retry with a new
     state won't be blocked. */
  return `connector-callback-fired:${params.state ?? 'unknown'}`;
}

export default function ConnectorCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ViewState>({ status: 'pending' });

  useEffect(() => {
    const params = readParams(searchParams);
    const key = guardKey(params);

    console.log('[connector-callback] mount', {
      code: params.code?.slice(0, 8),
      installationId: params.installationId,
      state: params.state?.slice(0, 20),
      providerError: params.providerError,
      alreadyFired: sessionStorage.getItem(key),
    });

    if (params.providerError) {
      setView({ status: 'error', message: params.providerError });
      return;
    }

    if (!params.state) {
      setView({
        status: 'error',
        message: 'Missing state. Try the connection again from Connectors.',
      });
      return;
    }

    if (!params.code && !params.installationId) {
      setView({
        status: 'error',
        message: 'Missing code / installation_id. Try the connection again.',
      });
      return;
    }

    /* StrictMode-safe one-shot guard. */
    if (sessionStorage.getItem(key) === '1') {
      console.log('[connector-callback] already fired for this state');
      return;
    }
    sessionStorage.setItem(key, '1');

    void (async () => {
      console.log('[connector-callback] invoking edge function…');
      const res = await handleCallback({
        state: params.state!,
        code: params.code,
        installationId: params.installationId,
      });
      console.log('[connector-callback] result', res);

      if (res.ok) {
        setView({ status: 'ok', provider: res.provider });
        const back = res.returnTo ?? '/today';
        setTimeout(() => navigate(back, { replace: true }), 900);
      } else {
        /* On failure, clear the guard so a manual retry works. */
        sessionStorage.removeItem(key);
        setView({ status: 'error', message: res.error });
      }
    })();
  }, [searchParams, navigate]);

  function handleRetry() {
    const params = readParams(searchParams);
    const key = guardKey(params);
    sessionStorage.removeItem(key);
    setView({ status: 'pending' });
    window.location.reload();
  }

  function handleBackToConnectors() {
    navigate('/ventures', { replace: true });
  }

  return (
    <div className="connector-callback">
      {view.status === 'pending' && (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Connecting…</p>
        </>
      )}
      {view.status === 'ok' && (
        <>
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p>
            {view.provider
              ? `${view.provider} connected. Returning…`
              : 'Connected. Returning…'}
          </p>
        </>
      )}
      {view.status === 'error' && (
        <>
          <AlertCircle className="h-5 w-5 text-[var(--error)]" />
          <p className="connector-callback__error-title">
            Connection failed
          </p>
          <p className="connector-callback__error-copy">{view.message}</p>
          <div className="connector-callback__actions">
            <button
              type="button"
              className="connector-callback__btn"
              onClick={handleRetry}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              type="button"
              className="connector-callback__btn is-primary"
              onClick={handleBackToConnectors}
            >
              Back to connectors
            </button>
          </div>
        </>
      )}
    </div>
  );
}
