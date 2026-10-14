import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PrimarySurfaceHeaderProps {
  title: string;
  status?: { label: string; tone?: 'accent' | 'success' | 'warning' };
  timestamp?: string;
  actions?: ReactNode;
  className?: string;
}

export function PrimarySurfaceHeader({
  title,
  status,
  timestamp,
  actions,
  className,
}: PrimarySurfaceHeaderProps) {
  return (
    <header className={cn('primary-surface__header', className)}>
      <div className="primary-surface__header-row">
        <h2 className="primary-surface__title">{title}</h2>
        <div className="primary-surface__meta">
          {status && (
            <span
              className={cn(
                'primary-surface__badge',
                status.tone === 'success' && 'primary-surface__badge--success',
                status.tone === 'warning' && 'primary-surface__badge--warning',
                (!status.tone || status.tone === 'accent') &&
                  'primary-surface__badge--accent'
              )}
            >
              {status.label}
            </span>
          )}
          {timestamp && (
            <span className="primary-surface__timestamp">{timestamp}</span>
          )}
        </div>
      </div>
      {actions && <div className="primary-surface__header-actions">{actions}</div>}
    </header>
  );
}
