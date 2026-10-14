import { FileText, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CardState = 'running' | 'unread' | 'read' | 'failed';

interface ResearchFileCardProps {
  label: string;
  summary?: string;
  /** True when the founder has opened the report at least once. */
  isViewed: boolean;
  /** True while the underlying thread is still running. */
  isRunning: boolean;
  /** True when the thread failed and no failureResolved flag is set. */
  isFailed: boolean;
  /** Fires when the founder clicks Review. */
  onReview: () => void;
}

export function ResearchFileCard({
  label,
  summary,
  isViewed,
  isRunning,
  isFailed,
  onReview,
}: ResearchFileCardProps) {
  const state: CardState = isFailed
    ? 'failed'
    : isRunning
    ? 'running'
    : isViewed
    ? 'read'
    : 'unread';

  const config = {
    running: {
      Icon: Loader2,
      chip: 'bg-[var(--info-muted)] text-[var(--info)]',
      badge: 'bg-[var(--info-muted)] text-[var(--info)]',
      badgeLabel: 'Running',
      iconSpin: true,
    },
    unread: {
      Icon: FileText,
      chip: 'bg-[var(--accent-muted)] text-[var(--accent)]',
      badge: 'bg-[var(--accent-muted)] text-[var(--accent)]',
      badgeLabel: 'New',
      iconSpin: false,
    },
    read: {
      Icon: CheckCircle2,
      chip: 'bg-[var(--success-muted)] text-[var(--success)]',
      badge: 'bg-[var(--success-muted)] text-[var(--success)]',
      badgeLabel: 'Reviewed',
      iconSpin: false,
    },
    failed: {
      Icon: AlertTriangle,
      chip: 'bg-[var(--error-muted,var(--surface-2))] text-[var(--error)]',
      badge: 'bg-[var(--error-muted,var(--surface-2))] text-[var(--error)]',
      badgeLabel: 'Needs attention',
      iconSpin: false,
    },
  }[state];

  const { Icon } = config;
  const canReview = state === 'unread' || state === 'read';

  return (
    <div
      className={cn(
        'research-file-card',
        state === 'unread' && 'is-unread',
        state === 'read' && 'is-read',
        state === 'running' && 'is-running',
        state === 'failed' && 'is-failed'
      )}
    >
      <div className="research-file-card__head">
        <span className="research-file-card__chip" style={{ background: 'transparent' }}>
          <span
            className="research-file-card__chip-inner"
            style={{ background: 'var(--surface-2)' }}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                config.iconSpin && 'research-file-card__chip-spin'
              )}
              style={{
                color: state === 'running'
                  ? 'var(--info)'
                  : state === 'unread'
                  ? 'var(--accent)'
                  : state === 'read'
                  ? 'var(--success)'
                  : 'var(--error)',
              }}
            />
          </span>
        </span>

        <div className="research-file-card__head-body">
          <p className="research-file-card__title">{label}</p>
          <span className={cn('research-file-card__badge', config.badge)}>
            {config.badgeLabel}
          </span>
        </div>
      </div>

      {summary && (
        <p className="research-file-card__summary">{summary}</p>
      )}

      <div className="research-file-card__footer">
        <button
          type="button"
          onClick={onReview}
          disabled={!canReview}
          className={cn(
            'research-file-card__review',
            state === 'unread' && 'is-primary',
            state === 'read' && 'is-secondary'
          )}
        >
          {state === 'read' ? 'View again' : 'Review'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}