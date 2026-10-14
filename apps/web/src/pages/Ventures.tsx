import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { useVentures, useCreateVenture } from '@/lib/hooks/useVentures';
import { useWorkspace } from '@/features/settings/useWorkspace';

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  validating: { bg: 'var(--info-muted)', fg: 'var(--info)', label: 'Validating' },
  building: { bg: 'var(--warning-muted)', fg: 'var(--warning)', label: 'Building' },
  launching: { bg: 'var(--accent-muted)', fg: 'var(--accent)', label: 'Launching' },
  operating: { bg: 'var(--success-muted)', fg: 'var(--success)', label: 'Operating' },
  paused: { bg: 'var(--surface-2)', fg: 'var(--text-muted)', label: 'Paused' },
  archived: { bg: 'var(--surface-2)', fg: 'var(--text-muted)', label: 'Archived' },
};

export default function VenturesPage() {
  const navigate = useNavigate();
  const { data: ventures = [], isLoading } = useVentures();
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
      setError('No workspace found. Complete onboarding first.');
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
      setError(e instanceof Error ? e.message : 'Failed to create venture');
    }
  }

  return (
    <PageContainer>
      <header className="marketplace-hero" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="marketplace-hero__title">Ventures</h1>
          <p className="marketplace-hero__lede">
            Every venture in this workspace. Open one to run ops, review deliverables, or check outcomes.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New venture
        </Button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : ventures.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: '48px 32px',
            borderRadius: 20,
            border: '1px dashed var(--border)',
            background: 'var(--surface-1)',
            textAlign: 'center',
          }}
        >
          <Briefcase
            className="mx-auto"
            style={{ width: 28, height: 28, color: 'var(--text-muted)' }}
          />
          <h2 style={{
            margin: '16px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            No ventures yet
          </h2>
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 13.5,
            color: 'var(--text-secondary)',
          }}>
            Start with an idea, or create a venture directly.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => navigate('/ideas')}>
              Go to Ideas
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New venture
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {ventures.map((v) => {
            const s = STATUS_STYLES[v.status] ?? STATUS_STYLES.validating;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => navigate(`/ventures/${v.id}`)}
                style={{
                  textAlign: 'left',
                  padding: '20px 22px',
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-1)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 160,
                  boxShadow: '0 1px 2px rgb(0 0 0 / 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)',
                  }}>
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: s.bg,
                    color: s.fg,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {s.label}
                  </span>
                </div>

                <div>
                  <p style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 650,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                  }}>
                    {v.name}
                  </p>
                  {v.description && (
                    <p style={{
                      margin: '4px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {v.description}
                    </p>
                  )}
                </div>

                <span style={{
                  marginTop: 'auto',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}>
                  Open venture
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      {dialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgb(0 0 0 / 0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 28,
              borderRadius: 18,
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 24px 64px rgb(0 0 0 / 0.28)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}>
                  New venture
                </h2>
                <p style={{
                  margin: '6px 0 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}>
                  Give it a working name. You can rename it later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div style={{ marginTop: 20 }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                placeholder="e.g. Contract Review AI"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-1)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--surface-2)',
                color: 'var(--error)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createVenture.isPending}
                className="gap-2"
              >
                {createVenture.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
