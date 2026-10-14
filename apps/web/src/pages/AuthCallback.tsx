import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  /* `next` is preserved through the login flow so an invite link
     survives sign-in. Falls back to /today. */
  const nextPath = searchParams.get('next') || '/today';

  useEffect(() => {
    let cancelled = false;
    let navigated = false;

    function go() {
      if (cancelled || navigated) return;
      navigated = true;
      navigate(nextPath, { replace: true });
    }

    // Hard timeout — if nothing works within 10s, show error.
    const timeout = setTimeout(() => {
      if (!cancelled && !navigated) {
        setError(
          'Sign-in is taking longer than expected. Try requesting a new link.'
        );
      }
    }, 10000);

    // Poll the session — URL parsing can lag behind mount.
    async function attempt() {
      if (cancelled || navigated) return;
      const { data, error } = await supabase.auth.getSession();
      if (cancelled || navigated) return;
      if (error) return; // transient — keep trying
      if (data.session) {
        clearTimeout(timeout);
        go();
      }
    }

    // Try immediately, then a few times with delays.
    attempt();
    const timers = [500, 1000, 2000, 3500].map((ms) =>
      setTimeout(attempt, ms)
    );

    // Also subscribe in case the SIGNED_IN event arrives late.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || navigated) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        clearTimeout(timeout);
        go();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      timers.forEach(clearTimeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate, nextPath]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
        {error ? (
          <>
            <AlertCircle
              style={{ width: 32, height: 32, color: 'var(--error)' }}
            />
            <h2
              style={{
                margin: '16px 0 0',
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Couldn't sign you in
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                color: 'var(--text-secondary)',
              }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                borderRadius: 10,
                border: 0,
                background: 'var(--accent)',
                color: 'var(--surface-0)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2
              style={{
                width: 28,
                height: 28,
                color: 'var(--accent)',
                margin: '0 auto',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p
              style={{
                margin: '16px 0 0',
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                color: 'var(--text-secondary)',
              }}
            >
              Signing you in…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
