
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ContentGridProps {
  children: ReactNode;
  fill?: boolean;
}

export function ContentGrid({
  children,
  fill = false,
}: ContentGridProps) {
  return (
    <div
      className={cn(
        'content-grid',
        fill && 'content-grid--fill'
      )}
    >
      <div
        className="content-grid__pattern"
        aria-hidden="true"
      />

      <div className="content-grid__content">
        {children}
      </div>
    </div>
  );
}
