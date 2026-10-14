import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PageShellProps {
  /** Content width tier. */
  width?: 'default' | 'reading' | 'wide';
  /** Extra classes applied after the tier classes. */
  className?: string;
  children: ReactNode;
}

/**
 * PageShell — the outer wrapper for any full-page surface.
 * Owns max-width, gutters, and vertical rhythm between children.
 * Nothing inside a page should set its own outer padding.
 */
export function PageShell({
  width = 'default',
  className,
  children,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'page-shell',
        width === 'reading' && 'page-shell--reading',
        width === 'wide' && 'page-shell--wide',
        className
      )}
    >
      {children}
    </div>
  );
}
