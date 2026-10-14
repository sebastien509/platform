import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Secondary line — a hint, a next step, or a support link. */
  recovery?: string;
  onRetry?: () => void;
  /** Lucide icon or icon element. Defaults to AlertTriangle. */
  icon?: ReactNode;
  /** Compact variant drops the icon chip + tightens padding. */
  variant?: 'default' | 'compact';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this content.",
  recovery,
  onRetry,
  icon,
  variant = 'default',
  className,
}: ErrorStateProps) {
  const compact = variant === 'compact';

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon chip — matches the EmptyState / agent-identity chip pattern */}
      {!compact && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--error-muted,var(--surface-2))] text-[var(--error)]">
          {icon ?? <AlertTriangle className="h-6 w-6" />}
        </div>
      )}

      <h3 className="text-base font-medium text-[var(--text-primary)]">{title}</h3>

      <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed">
        {message}
      </p>

      {recovery && (
        <p className="mt-2 max-w-sm text-2xs text-[var(--text-muted)] leading-relaxed">
          {recovery}
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-5 inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium',
            'bg-[var(--accent-muted)] text-[var(--accent)]',
            'hover:bg-[var(--accent-muted)]/80 transition-colors'
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}