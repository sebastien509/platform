import { cn } from '@/lib/utils/cn';

export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent';

interface StatusBadgeProps {
  tone?: StatusTone;
  /** Compact Shopify-style pill. Defaults to neutral. */
  children: string;
  className?: string;
}

/**
 * StatusBadge — compact, dot-prefixed status pill.
 * Used inside ObjectCards, list rows, and section headers.
 * One component for every status across the platform.
 */
export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn('status-badge', `is-${tone}`, className)}
      data-tone={tone}
    >
      {children}
    </span>
  );
}
