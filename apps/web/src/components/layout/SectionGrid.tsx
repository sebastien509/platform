import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SectionGridProps {
  /** Gap scale between grid items. */
  gap?: 'compact' | 'default' | 'roomy';
  className?: string;
  children: ReactNode;
}

/**
 * SectionGrid — 12-column bento layout.
 * Sections declare their span via `data-size` on the child
 * (see Section's `size` prop). The grid reads that attribute
 * to place them. On small screens every child collapses to
 * full width.
 */
export function SectionGrid({
  gap = 'default',
  className,
  children,
}: SectionGridProps) {
  return (
    <div
      className={cn(
        'section-grid',
        gap === 'compact' && 'section-grid--compact',
        gap === 'roomy' && 'section-grid--roomy',
        className
      )}
    >
      {children}
    </div>
  );
}
