import { useNavigate } from 'react-router-dom';

import {
  Briefcase,
  Lightbulb,
  ArrowUpRight,
  Loader2,
  Monitor,
} from 'lucide-react';

import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { useVentures } from '@/lib/hooks/useVentures';

import './Ventures.css';

const STATUS_STYLES: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  validating: {
    bg: 'var(--info-muted)',
    fg: 'var(--info)',
    label: 'Validating',
  },
  building: {
    bg: 'var(--warning-muted)',
    fg: 'var(--warning)',
    label: 'Building',
  },
  launching: {
    bg: 'var(--accent-muted)',
    fg: 'var(--accent)',
    label: 'Launching',
  },
  operating: {
    bg: 'var(--success-muted)',
    fg: 'var(--success)',
    label: 'Operating',
  },
  paused: {
    bg: 'var(--surface-2)',
    fg: 'var(--text-muted)',
    label: 'Paused',
  },
  archived: {
    bg: 'var(--surface-2)',
    fg: 'var(--text-muted)',
    label: 'Archived',
  },
};

/**
 * VenturesPage — the workspace's ventures, in one list.
 *
 * Ventures are NOT created here. Every venture begins as an idea
 * that graduates through the idea journey (capture → clean →
 * research → synthesize → validate). The validate step creates
 * the venture and lands the founder on the venture shell.
 *
 * This page is the result, not the starting point.
 */
export default function VenturesPage() {
  const navigate = useNavigate();
  const { data: ventures = [], isLoading } = useVentures();

  return (
    <PageContainer>
      <div className="iv-ventures-page">

        <header className="iv-ventures-page__header">
          <div className="iv-ventures-page__intro">
            <span className="iv-ventures-page__eyebrow">
              YOUR WORKSPACE
            </span>

            <h1 className="iv-ventures-page__title">
              Ventures
            </h1>

            <p className="iv-ventures-page__description">
              Every venture in this workspace. Open one to run ops,
              review deliverables, or check outcomes.
            </p>
          </div>
        </header>

        <aside className="iv-ventures-page__desktop-note">
          <div className="iv-ventures-page__desktop-icon">
            <Monitor size={19} />
          </div>

          <div className="iv-ventures-page__desktop-copy">
            <strong>
              Your operating workspace lives on desktop
            </strong>

            <p>
              Browse your ventures here. Strategy, Engineering, GTM,
              operations and advanced intelligence are designed for
              a larger screen.
            </p>
          </div>
        </aside>

        {isLoading ? (
          <div
            className="iv-ventures-page__loading"
            role="status"
            aria-label="Loading ventures"
          >
            <Loader2
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            <span>Loading your ventures...</span>
          </div>
        ) : ventures.length === 0 ? (
          <div className="iv-ventures-page__empty">
            <div className="iv-ventures-page__empty-icon">
              <Lightbulb size={24} />
            </div>

            <h2>No ventures yet</h2>

            <p>
              Ventures appear here once an idea has been validated.
              Start from an idea — the journey creates the venture.
            </p>

            <div className="iv-ventures-page__empty-actions">
              <Button
                variant="outline"
                onClick={() => navigate('/ideas')}
              >
                Go to Ideas
              </Button>
            </div>
          </div>
        ) : (
          <div className="iv-ventures-page__grid">
            {ventures.map((venture) => {
              const statusKey = (
                venture.status || 'validating'
              ).toLowerCase();

              const status =
                STATUS_STYLES[statusKey] ??
                STATUS_STYLES.validating;

              return (
                <button
                  key={venture.id}
                  type="button"
                  onClick={() =>
                    navigate(`/ventures/${venture.id}`)
                  }
                  className="iv-ventures-card"
                  aria-label={`Open ${venture.name || 'Untitled venture'}`}
                >
                  <div className="iv-ventures-card__top">
                    <span className="iv-ventures-card__icon">
                      <Briefcase size={17} />
                    </span>

                    <span
                      className="iv-ventures-card__status"
                      style={{
                        background: status.bg,
                        color: status.fg,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="iv-ventures-card__content">
                    <h2>
                      {venture.name || 'Untitled venture'}
                    </h2>

                    {venture.description && (
                      <p>{venture.description}</p>
                    )}
                  </div>

                  <div className="iv-ventures-card__footer">
                    <span>
                      <span className="iv-ventures-card__desktop-action">
                        Open venture
                      </span>

                      <span className="iv-ventures-card__mobile-action">
                        View venture
                      </span>
                    </span>

                    <ArrowUpRight
                      size={17}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </PageContainer>
  );
}
