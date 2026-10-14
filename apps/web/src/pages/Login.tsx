import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {

  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setState('sending');
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setState('error');
      setError(error.message);
      return;
    }

    setState('sent');
  }

  async function handleGoogle() {
    setState('sending');
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
      },
    });

    if (error) {
      setState('error');
      setError(error.message);
    }
  }

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
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 32,
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          boxShadow: 'var(--iv-shadow-card, 0 1px 3px rgba(0,0,0,0.04))',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          IV Platform
        </p>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
          }}
        >
          {state === 'sent' ? 'Check your email' : 'Sign in'}
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 13.5,
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
          }}
        >
          {state === 'sent'
            ? `We sent a sign-in link to ${email}. Click it to continue.`
            : 'Enter your email to receive a sign-in link, or continue with Google.'}
        </p>

        {state !== 'sent' && (
          <>
            <form onSubmit={handleMagicLink} style={{ marginTop: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <Mail
                  style={{
                    width: 16,
                    height: 16,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={state === 'sending'}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!email.trim() || state === 'sending'}
                style={{
                  marginTop: 12,
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: 0,
                  background: 'var(--accent)',
                  color: 'var(--surface-0)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13.5,
                  fontWeight: 650,
                  cursor: !email.trim() || state === 'sending' ? 'not-allowed' : 'pointer',
                  opacity: !email.trim() || state === 'sending' ? 0.5 : 1,
                }}
              >
                {state === 'sending' ? (
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    Send magic link
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '20px 0',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              or
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={state === 'sending'}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-1)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: state === 'sending' ? 'not-allowed' : 'pointer',
                opacity: state === 'sending' ? 0.5 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {state === 'sent' && (
          <div
            style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--success-muted)',
              color: 'var(--success)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Check style={{ width: 14, height: 14 }} />
            Link sent — check your inbox
          </div>
        )}

        {state === 'error' && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--error-muted, var(--surface-2))',
              color: 'var(--error)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
