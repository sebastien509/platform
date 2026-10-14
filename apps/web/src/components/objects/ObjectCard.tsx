import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { StatusBadge, type StatusTone } from './StatusBadge';

export interface ObjectMeta {
  label: string;
  value: string;
}

interface ObjectCardProps {
  /** Small caps label at the top — "ICP", "Requirement", "Deployment". */
  eyebrow?: string;
  /** Optional icon node rendered before the eyebrow. */
  icon?: ReactNode;
  /** Optional status pill, top-right. */
  status?: string;
  statusTone?: StatusTone;
  /** Optional headline. */
  title?: string;
  /** Optional description body. */
  description?: string;
  /** Optional metadata row — key/value chips at the bottom. */
  meta?: ObjectMeta[];
  /** Optional footer actions, right-aligned. */
  actions?: ReactNode;
  /** Visual tier. */
  variant?: 'default' | 'wide' | 'featured' | 'compact';
  /** Optional grid span when inside a SectionGrid. */
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  /** Optional data-status, exposed for styling hooks. */
  dataStatus?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ObjectCard — the universal card for any business object.
 * Powers ICP, Requirement, Deployment, Experiment, Campaign,
 * Lead, and anything else with eyebrow + title + status + meta.
 *
 * The card owns structure; the data decides identity.
 */
export function ObjectCard({
  eyebrow,
  icon,
  status,
  statusTone = 'neutral',
  title,
  description,
  meta,
  actions,
  variant = 'default',
  span,
  dataStatus,
  className,
  children,
}: ObjectCardProps) {
  return (
    <article
      className={cn(
        'object-card',
        variant === 'wide' && 'object-card--wide',
        variant === 'featured' && 'object-card--featured',
        variant === 'compact' && 'object-card--compact',
        className
      )}
      data-size={span ? (span === 12 ? 'full' : span >= 7 ? 'wide' : span >= 5 ? 'half' : 'compact') : undefined}
      data-status={dataStatus}
    >
      {(eyebrow || status) && (
        <header className="object-card__top">
          {eyebrow && (
            <span className="object-card__eyebrow">
              {icon && <span className="object-card__icon">{icon}</span>}
              {eyebrow}
            </span>
          )}
          {status && (
            <StatusBadge tone={statusTone}>{status}</StatusBadge>
          )}
        </header>
      )}

      {title && <h3 className="object-card__title">{title}</h3>}

      {description && (
        <p className="object-card__description">{description}</p>
      )}

      {children}

      {meta && meta.length > 0 && (
        <div className="object-card__meta">
          {meta.map((m) => (
            <span key={m.label} className="object-card__meta-item">
              <span className="object-card__meta-label">{m.label}</span>
              <span className="object-card__meta-value">{m.value}</span>
            </span>
          ))}
        </div>
      )}

      {actions && <footer className="object-card__footer">{actions}</footer>}
    </article>
  );
}
