import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface EvidenceItemProps {
  /** Small icon node shown in a rounded square. */
  icon?: ReactNode;
  /** One-line title. */
  title: string;
  /** Optional supporting detail. */
  body?: string;
  /** Optional trailing meta — "Sep 29", "8 points", "Verified". */
  meta?: string;
  className?: string;
}

/**
 * EvidenceItem — one piece of evidence.
 * Used across Strategy, Product, GTM, Sales.
 * Interviews, analytics, quotes, research docs all use this.
 */
export function EvidenceItem({
  icon,
  title,
  body,
  meta,
  className,
}: EvidenceItemProps) {
  return (
    <div className={cn('evidence-item', className)}>
      {icon && <span className="evidence-item__icon">{icon}</span>}
      <div className="evidence-item__content">
        <span className="evidence-item__title">{title}</span>
        {body && <span className="evidence-item__body">{body}</span>}
      </div>
      {meta && <span className="evidence-item__meta">{meta}</span>}
    </div>
  );
}
