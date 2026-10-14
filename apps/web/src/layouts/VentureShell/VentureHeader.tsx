
import type { CSSProperties } from 'react';
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

export function VentureHeader({
  venture,
}: VentureHeaderProps) {
  const navigate = useNavigate();

  const pendingCheckpointCount = useUIStore(
    (s) => s.pendingCheckpointCount
  );

  if (!venture) {
    return (
      <header className="iv-venture-header iv-venture-header--loading shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="iv-venture-header__inner">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
        </div>
      </header>
    );
  }

  const healthValues = Object.values(
    venture.health || {}
  ).filter(
    (value): value is number =>
      typeof value === 'number'
  );

  const avgHealth = healthValues.length
    ? Math.round(
        healthValues.reduce(
          (sum, value) => sum + value,
          0
        ) / healthValues.length
      )
    : 0;

  const healthColor =
    avgHealth > 70
      ? 'text-[var(--success)]'
      : avgHealth > 40
        ? 'text-[var(--warning)]'
        : 'text-[var(--error)]';

  const statusKey = (
    venture.status || ''
  ).toLowerCase();

  const statusClass =
    STATUS_STYLES[statusKey] ||
    'bg-[var(--surface-2)] text-[var(--text-muted)]';

  const statusLabel =
    STATUS_LABELS[statusKey] ||
    venture.status ||
    'Active';

  const hue = placeholderHue(
    (venture as HeaderVenture & { ideaId?: string }).ideaId ??
      venture.id
  );

  return (
    <header
      className="iv-venture-header venture-header--tinted shrink-0 border-b border-[var(--border-subtle)]"
      style={
        {
          '--venture-hue': String(hue),
        } as CSSProperties
      }
    >
      <div className="iv-venture-header__inner">
        <div className="iv-venture-header__identity">
          <h1 className="iv-venture-header__name">
            {venture.name || 'Untitled venture'}
          </h1>

          <Badge
            className={cn(
              'iv-venture-header__status capitalize text-2xs',
              statusClass
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <div className="iv-venture-header__actions">
          <div className="iv-venture-header__run-dock">
            <RunDock />
          </div>

          <div className="iv-venture-header__agent-trigger">
            <AgentDrawerTrigger />
          </div>

          <span
            className="iv-venture-header__separator"
            aria-hidden="true"
          />

          {healthValues.length > 0 && (
            <div className="iv-venture-header__health">
              <span className="iv-venture-header__health-label">
                Health
              </span>

              <span
                className={cn(
                  'font-semibold tabular-nums',
                  healthColor
                )}
              >
                {avgHealth}%
              </span>
            </div>
          )}

          {pendingCheckpointCount > 0 && (
            <Badge className="iv-venture-header__checkpoint animate-pulse motion-reduce:animate-none bg-[var(--warning-muted)] text-[var(--warning)] text-2xs">
              {pendingCheckpointCount} checkpoint
              {pendingCheckpointCount > 1 ? 's' : ''}
            </Badge>
          )}

          <button
            type="button"
            onClick={() =>
              navigate(`/ventures/${venture.id}`)
            }
            className={cn(
              'iv-venture-header__overview',
              'rounded-lg px-3 py-1 text-2xs font-medium',
              'bg-[var(--accent-muted)] text-[var(--accent)]',
              'hover:bg-[var(--accent-muted)]/80',
              'transition-colors'
            )}
          >
            View Overview
          </button>
        </div>
      </div>
    </header>
  );
}
