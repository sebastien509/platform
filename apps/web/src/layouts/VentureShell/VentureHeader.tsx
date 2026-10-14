import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/lib/stores/uiStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { placeholderHue } from '@/lib/utils/placeholderHue';
import { AgentDrawerTrigger } from '@/features/agent-drawer';
import { RunDock } from '@/features/agent-drawer/RunDock';

interface HeaderVenture {
  id: string;
  name: string | null;
  status?: string | null;
  health?: Record<string, number> | null;
}

interface VentureHeaderProps {
  venture?: HeaderVenture | null;
}

const STATUS_STYLES: Record<string, string> = {
  validating: 'bg-[var(--info-muted)] text-[var(--info)]',
  building: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  launching: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  operating: 'bg-[var(--success-muted)] text-[var(--success)]',
  paused: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  archived: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

const STATUS_LABELS: Record<string, string> = {
  validating: 'Validating',
  building: 'Building',
  launching: 'Launching',
  operating: 'Operating',
  paused: 'Paused',
  archived: 'Archived',
};

/**
 * VentureHeader — the venture's identity strip.
 *
 * Just the venture name, status pill, run dock, agent trigger,
 * health %, and view overview button. Navigation between venture
 * pages lives in VentureSidebar, not here — one nav surface.
 */
export function VentureHeader({ venture }: VentureHeaderProps) {
  const navigate = useNavigate();
  const { pendingCheckpointCount } = useUIStore();

  if (!venture) {
    return (
      <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="flex h-14 items-center px-6 gap-6">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
        </div>
      </header>
    );
  }

  const healthValues = Object.values(
    (venture.health as unknown as Record<string, number>) || {}
  ).filter((v): v is number => typeof v === 'number');
  const avgHealth = healthValues.length
    ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length)
    : 0;
  const healthColor =
    avgHealth > 70
      ? 'text-[var(--success)]'
      : avgHealth > 40
      ? 'text-[var(--warning)]'
      : 'text-[var(--error)]';

  const statusKey = (venture.status || '').toLowerCase();
  const statusClass =
    STATUS_STYLES[statusKey] || 'bg-[var(--surface-2)] text-[var(--text-muted)]';
  const statusLabel = STATUS_LABELS[statusKey] || venture.status || 'Active';

  const hue = placeholderHue(
    (venture as any).ideaId ?? venture.id
  );

  return (
    <header
      className="venture-header--tinted shrink-0 border-b border-[var(--border-subtle)]"
      style={{ '--venture-hue': String(hue) } as React.CSSProperties}
    >
      <div className="flex h-14 items-center px-6 gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {venture.name || 'Untitled venture'}
          </h1>
          <Badge className={cn('capitalize text-2xs', statusClass)}>
            {statusLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-3 ml-auto text-sm shrink-0">
          <RunDock />

          <AgentDrawerTrigger />

          <span className="h-5 w-px bg-[var(--border-subtle)]" aria-hidden />

          {healthValues.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xs uppercase tracking-wider text-[var(--text-muted)]">
                Health
              </span>
              <span className={cn('font-semibold tabular-nums', healthColor)}>
                {avgHealth}%
              </span>
            </div>
          )}

          {pendingCheckpointCount > 0 && (
            <Badge className="animate-pulse motion-reduce:animate-none bg-[var(--warning-muted)] text-[var(--warning)] text-2xs">
              {pendingCheckpointCount} checkpoint
              {pendingCheckpointCount > 1 ? 's' : ''}
            </Badge>
          )}

          <button
            type="button"
            onClick={() => navigate(`/ventures/${venture.id}`)}
            className={cn(
              'rounded-lg px-3 py-1 text-2xs font-medium',
              'bg-[var(--accent-muted)] text-[var(--accent)]',
              'hover:bg-[var(--accent-muted)]/80 transition-colors'
            )}
          >
            View Overview
          </button>
        </div>
      </div>
    </header>
  );
}
