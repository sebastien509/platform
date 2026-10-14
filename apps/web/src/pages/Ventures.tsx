
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Plus,
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Monitor,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';

import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import {
  useVentures,
  useCreateVenture,
} from '@/lib/hooks/useVentures';
import { useWorkspace } from '@/features/settings/useWorkspace';

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

export default function VenturesPage() {
  const navigate = useNavigate();

  const {
    data: ventures = [],
    isLoading,
  } = useVentures();

  const { data: workspace } = useWorkspace();
  const createVenture = useCreateVenture();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!workspace?.id) {
      setError(
        'No workspace found. Complete onboarding first.'
      );
      return;
    }

    try {
      const created = await createVenture.mutateAsync({
        name,
        workspaceId: workspace.id,
      });

      setName('');
      setDialogOpen(false);

      navigate(`/ventures/${created.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to create venture'
      );
    }
  }

  return (
    <PageContainer>
      <div className="iv-ventures-page">

        {/* Page introduction */}
        <header className="iv-ventures-page__header">
          <div className="iv-ventures-page__intro">
            <span className="iv-ventures-page__eyebrow">
              YOUR WORKSPACE
            </span>

            <h1 className="iv-ventures-page__title">
              Ventures
            </h1>

            <p className="iv-ventures-page__description">
              Every venture in this workspace. Open one
              to run ops, review deliverables, or check
              outcomes.
            </p>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            className="iv-ventures-page__new-button gap-2"
          >
            <Plus className="h-4 w-4" />
            New venture
          </Button>
        </header>

        {/* Mobile-only desktop-access guidance */}
        <aside className="iv-ventures-page__desktop-note">
          <div className="iv-ventures-page__desktop-icon">
            <Monitor size={19} />
          </div>

          <div className="iv-ventures-page__desktop-copy">
            <strong>
              Your operating workspace lives on desktop
            </strong>

            <p>
              Browse your ventures here. Strategy,
              Engineering, GTM, operations and advanced
              intelligence are designed for a larger screen.
            </p>
          </div>
        </aside>

        {/* Ventures list */}
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
              Start with an idea, or create a venture
              directly.
            </p>

            <div className="iv-ventures-page__empty-actions">
              <Button
                variant="outline"
                onClick={() => navigate('/ideas')}
              >
                Go to Ideas
              </Button>

              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2"
              >
                <Plus size={15} />
                New venture
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

        {/* Create venture dialog — existing workflow */}
        {dialogOpen && (
          <div
            className="iv-ventures-dialog__overlay"
            onClick={() => setDialogOpen(false)}
          >
            <div
              className="iv-ventures-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="iv-new-venture-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="iv-ventures-dialog__header">
                <div>
                  <h2 id="iv-new-venture-title">
                    New venture
                  </h2>

                  <p>
                    Give it a working name.
                    You can rename it later.
                  </p>
                </div>

                <button
                  type="button"
                  className="iv-ventures-dialog__close"
                  onClick={() => setDialogOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="iv-ventures-dialog__field">
                <label
                  htmlFor="iv-venture-name"
                  className="iv-ventures-dialog__label"
                >
                  Venture name
                </label>

                <input
                  id="iv-venture-name"
                  autoFocus
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate();
                    }
                  }}
                  placeholder="e.g. Contract Review AI"
                />
              </div>

              {error && (
                <div
                  className="iv-ventures-dialog__error"
                  role="alert"
                >
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="iv-ventures-dialog__actions">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleCreate}
                  disabled={createVenture.isPending}
                  className="gap-2"
                >
                  {createVenture.isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <>
                      Create
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
