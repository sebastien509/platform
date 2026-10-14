import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import './page-container.css';

type PageWidth = 'narrow' | 'default' | 'wide' | 'full';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Content max-width tier.
   *   narrow  — 640px  · reading, forms, single-column focus
   *   default — var(--content-max-width) · 720 Structured / 680 Warm
   *   wide    — 1200px · workspaces, grids, dashboards
   *   full    — no cap (page owns the gutter)
   */
  width?: PageWidth;
}

const WIDTH_CLASS: Record<PageWidth, string> = {
  narrow:  'page-container--narrow',
  default: 'page-container--default',
  wide:    'page-container--wide',
  full:    'page-container--full',
};

export function PageContainer({
  children,
  className,
  width = 'default',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'page-container',
        WIDTH_CLASS[width],
        className
      )}
    >
      {children}
    </div>
  );
}