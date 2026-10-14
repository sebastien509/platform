import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContentGridProps {
  children: ReactNode;
  /**
   * Fill mode: content stretches to the full height of the content area
   * and manages its own scroll. Used by VentureShell and other
   * full-height layouts. Non-fill pages scroll naturally.
   */
  fill?: boolean;
}

/**
 * The Content Canvas — dotted grid background.
 *
 * Applied only behind the main scrollable content area. Never behind
 * the sidebar or topbar. Fades radially from the top so the grid reads
 * as an opening texture, not a permanent overlay.
 *
 * See brand doc §8.
 */
export function ContentGrid({ children, fill = false }: ContentGridProps) {
  return (
    <div className={cn('content-grid', fill && 'content-grid--fill')}>
      <div className="content-grid__pattern" aria-hidden="true" />
      <div className="content-grid__content">{children}</div>
    </div>
  );
}