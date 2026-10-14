import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface VenturePageShellProps {
  eyebrow: string;
  title: string;
  /** Optional — emits a .venture-page--<pageId> modifier so each
   *  page has a hook for per-sector tweaks. */
  pageId?: string;
  children: ReactNode;
}

/**
 * Every venture page uses this shell — a bento grid, not a stack
 * with bento cards embedded in it. Same grid as Idea Home.
 */
export function VenturePageShell({
  eyebrow,
  title,
  pageId,
  children,
}: VenturePageShellProps) {
  return (
    <div
      className={cn(
        'venture-page',
        pageId && `venture-page--${pageId}`
      )}
    >
      <header className="venture-page__header">
        <span className="venture-page__eyebrow">{eyebrow}</span>
        <h1 className="venture-page__title">{title}</h1>
      </header>
      <div className="venture-bento">{children}</div>
    </div>
  );
}
