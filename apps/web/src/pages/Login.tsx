
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

import './Login.css';

type State = 'idle' | 'sending' | 'sent' | 'error';

const IV_WORDMARK =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png';

const SIDE_IMAGE =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/v1792016983/pexels-apasaric-4505907_hfiwoq.jpg';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  const busy = state === 'sending';

  const callbackUrl = `${
    window.location.origin
  }/auth/callback${
    next
      ? `?next=${encodeURIComponent(next)}`
      : ''
  }`;

  async function handleMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();

    if (!trimmed || busy) return;

    setState('sending');
    setError('');

    try {
      const { error: authError } =
        await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo: callbackUrl,
            shouldCreateUser: true,
          },
        });

      if (authError) throw authError;

      setEmail(trimmed);
      setState('sent');
    } catch (err) {
      setState('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send your sign-in link.'
      );
    }
  }

  async function handleGoogle() {
    if (busy) return;

    setState('sending');
    setError('');

    try {
      const { error: authError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
          },
        });

      if (authError) throw authError;
    } catch (err) {
      setState('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to continue with Google.'
      );
    }
  }

  return (
    <main className="iv-login">
      <div className="iv-login__layout">
        {/* LEFT — Existing authentication experience */}
        <section
          className="iv-login__card"
          aria-labelledby="iv-login-title"
        >
          <div className="iv-login__card-header">
            <p className="iv-login__eyebrow">
              IV Platform
            </p>

            <h1
              id="iv-login-title"
              className="iv-login__title"
            >
              {state === 'sent'
                ? 'Check your email'
                : 'Sign in'}
            </h1>

            <p className="iv-login__description">
              {state === 'sent'
                ? `We sent a sign-in link to ${email}. Click it to continue.`
                : 'Enter your email to receive a sign-in link, or continue with Google.'}
            </p>
          </div>

          {state !== 'sent' && (
            <div className="iv-login__auth">
              <form onSubmit={handleMagicLink}>
                <label
                  htmlFor="iv-login-email"
                  className="iv-login__sr-only"
                >
                  Email address
                </label>

                <div className="iv-login__input-field">
                  <Mail
                    size={17}
                    aria-hidden="true"
                  />

                  <input
                    id="iv-login-email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@company.com"
                    disabled={busy}
                  />
                </div>

                <button
                  type="submit"
                  className="iv-login__primary"
                  disabled={!email.trim() || busy}
                >
                  {busy ? (
                    <Loader2
                      className="iv-login__spinner"
                      size={16}
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      Send magic link
                      <ArrowRight
                        size={16}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="iv-login__divider">
                <span />
                <span>or</span>
                <span />
              </div>

              <button
                type="button"
                className="iv-login__google"
                onClick={handleGoogle}
                disabled={busy}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>

                Continue with Google
              </button>
            </div>
          )}

          {state === 'sent' && (
            <div
              className="iv-login__sent"
              role="status"
            >
              <Check
                size={17}
                aria-hidden="true"
              />
              Link sent — check your inbox
            </div>
          )}

          {state === 'error' && (
            <div
              className="iv-login__error"
              role="alert"
            >
              {error}
            </div>
          )}
        </section>

        {/* RIGHT — Photography and white IV logo */}
        <aside
          className="iv-login__visual"
          aria-label="Ideas to Venture"
        >
          <img
            src={SIDE_IMAGE}
            alt=""
            className="iv-login__visual-photo"
            loading="eager"
            fetchPriority="high"
          />

          <div
            className="iv-login__visual-shade"
            aria-hidden="true"
          />

          <div className="iv-login__visual-content">
            <img
              src={IV_WORDMARK}
              alt="IV — Ideas to Venture"
              className="iv-login__visual-logo"
            />

            <div className="iv-login__visual-bottom">
              <h2>
                From ideas
                <br />
                to ventures.
              </h2>

              <p>
                Your workspace to build
                what comes next.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
