
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LifeBuoy,
  AlertCircle,
} from 'lucide-react';

import './ErrorPage.css';

const IV_LOGO =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/v1789515534/Branding_IV_Basic_color_Blue_wm3tzo.png';

const IV_WORDMARK =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png';

interface ErrorPageProps {
  error?: unknown;
  status?: 404 | 500;
}

function makeReferenceCode(): string {
  return (
    'IV-' +
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
}

export function ErrorPage({ error, status }: ErrorPageProps) {
  const navigate = useNavigate();

  const resolvedStatus: 404 | 500 =
    status ?? (error === undefined ? 404 : 500);

  const is404 = resolvedStatus === 404;

  const referenceCode = useMemo(
    () => (is404 ? null : makeReferenceCode()),
    [is404]
  );

  return (
    <main className="iv-error-page">
      <div
        className="iv-error-page__ambient"
        aria-hidden="true"
      />

      <div className="iv-error-page__shell">
        <header className="iv-error-page__header">
          <button
            type="button"
            className="iv-error-page__brand"
            onClick={() => navigate('/today')}
            aria-label="IV — Go to Today"
          >
            <img
              src={IV_WORDMARK}
              className="iv-error-page__wordmark"
              alt="IV by InthraOS"
            />
          </button>

          <span className="iv-error-page__header-meta">
            IV PLATFORM
          </span>
        </header>

        <section className="iv-error-page__main">
          <div className="iv-error-page__copy">
            <div className="iv-error-page__eyebrow">
              <span
                className="iv-error-page__eyebrow-dot"
                aria-hidden="true"
              />
              {is404
                ? 'PAGE NOT FOUND'
                : 'UNEXPECTED ERROR'}
            </div>

            <div className="iv-error-page__heading-group">
              <span className="iv-error-page__code">
                {resolvedStatus}
              </span>

              <h1 className="iv-error-page__title">
                {is404
                  ? 'Looks like a wrong turn.'
                  : 'Something interrupted your flow.'}
              </h1>
            </div>

            <p className="iv-error-page__description">
              {is404
                ? "We couldn't find the page you're looking for. It may have moved or the address may be incorrect."
                : "We couldn't complete this request. Try returning to your workspace or going back to the previous page."}
            </p>

            <div className="iv-error-page__actions">
              <button
                type="button"
                className="iv-error-page__button iv-error-page__button--primary"
                onClick={() => navigate('/today')}
              >
                Back to Today
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="iv-error-page__button iv-error-page__button--secondary"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft
                  size={16}
                  aria-hidden="true"
                />
                Go back
              </button>
            </div>

            {referenceCode && (
              <div className="iv-error-page__reference">
                <AlertCircle
                  size={14}
                  aria-hidden="true"
                />
                <span>
                  Error reference: {referenceCode}
                </span>
              </div>
            )}

            {import.meta.env.DEV &&
              error !== undefined && (
                <details className="iv-error-page__debug">
                  <summary>
                    Developer details
                  </summary>
                  <pre>
                    {error instanceof Error
                      ? error.stack ?? error.message
                      : String(error)}
                  </pre>
                </details>
              )}
          </div>

          <div
            className="iv-error-page__art"
            aria-hidden="true"
          >
            <div className="iv-error-page__art-grid" />

            <span className="iv-error-page__art-number">
              {resolvedStatus}
            </span>

            <div className="iv-error-page__art-logo">
              <img
                src={IV_LOGO}
                alt=""
              />
            </div>

            <div className="iv-error-page__art-label">
              <span className="iv-error-page__art-line" />
              IDEAS INTO VENTURES
            </div>
          </div>
        </section>

        <section
          className="iv-error-page__next"
          aria-label="Other destinations"
        >
          <div className="iv-error-page__next-intro">
            <span className="iv-error-page__next-eyebrow">
              NEXT STEP
            </span>
            <h2>
              Find your way forward
            </h2>
            <p>
              Your workspace is a good place to start.
            </p>
          </div>

          <div className="iv-error-page__next-links">
            <button
              type="button"
              className="iv-error-page__next-link"
              onClick={() => navigate('/knowledge')}
            >
              <span className="iv-error-page__next-icon">
                <BookOpen size={17} />
              </span>

              <span className="iv-error-page__next-copy">
                <strong>Knowledge</strong>
                <small>
                  Browse your workspace resources
                </small>
              </span>

              <ArrowRight
                className="iv-error-page__next-arrow"
                size={16}
              />
            </button>

            <a
              className="iv-error-page__next-link"
              href="mailto:support@inthra.os"
            >
              <span className="iv-error-page__next-icon">
                <LifeBuoy size={17} />
              </span>

              <span className="iv-error-page__next-copy">
                <strong>Contact support</strong>
                <small>
                  Get help with this issue
                </small>
              </span>

              <ArrowRight
                className="iv-error-page__next-arrow"
                size={16}
              />
            </a>
          </div>
        </section>

        <footer className="iv-error-page__footer">
          <span>
            IV · Ideas to Venture
          </span>

          <span>
            Built by InthraOS
          </span>
        </footer>
      </div>
    </main>
  );
}

export default ErrorPage;
