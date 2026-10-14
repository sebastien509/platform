import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SectionProps {
  /** Stable id — used for scroll targets and config keys. */
  id: string;
  title?: string;
  description?: string;
  /** Optional icon node, rendered before the title. */
  icon?: ReactNode;
  /** Actions cluster, right-aligned in the section header. */
  actions?: ReactNode;
  /** Visual tier — controls grid span when inside a SectionGrid. */
  size?: 'full' | 'wide' | 'half' | 'compact';
  className?: string;
  children: ReactNode;
}

/**
 * Section — the shell for any distinct block on a page.
 * Owns the header treatment (icon + title + description + actions)
 * and the vertical rhythm of its content. The content itself is
 * rendered by whatever component the caller passes.
 */
export function Section({
  id,
  title,
  description,
  icon,
  actions,
  size,
  className,
  children,
}: SectionProps) {
  const hasHeader = Boolean(title || actions || description);

  return (
    <section
      id={id}
      className={cn('section', className)}
      data-size={size}
    >
      {hasHeader && (
        <header className="section__head">
          <div className="section__heading">
            {icon && <span className="section__icon">{icon}</span>}
            <div className="section__heading-text">
              {title && <h2 className="section__title">{title}</h2>}
              {description && (
                <p className="section__description">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="section__actions">{actions}</div>}
        </header>
      )}
      <div className="section__body">{children}</div>
    </section>
  );
}
