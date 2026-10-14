import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Lucide icon or icon element. Defaults to Sparkles. */
  icon?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'compact';
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl',
          'bg-[var(--surface-2)] text-[var(--text-muted)]',
          compact ? 'h-10 w-10 mb-3' : 'h-12 w-12 mb-4'
        )}
      >
        {icon ?? <Sparkles className={compact ? 'h-5 w-5' : 'h-6 w-6'} />}
      </div>

      <h3
        className={cn(
          'font-medium text-[var(--text-primary)]',
          compact ? 'text-sm' : 'text-base'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'mt-1.5 max-w-sm text-sm text-[var(--text-secondary)] leading-relaxed'
          )}
        >
          {description}
        </p>
      )}

      {action && <div className={compact ? 'mt-4' : 'mt-5'}>{action}</div>}
    </div>
  );
}