import { cn } from '@/lib/utils/cn';
import { IVLoader } from '@/features/loading';

interface LoadingSkeletonProps {
  className?: string;
  /**
   * @deprecated The component now renders a single centered loading state
   * (branded IVLoader) rather than a stack of gray pulse blocks. The prop
   * is accepted but ignored so existing call sites continue to type-check.
   */
  count?: number;
  /**
   * Sizing hint. Maps to the loading surface's minimum height.
   *   card   — 128px  (default)
   *   list   — 80px
   *   grid   — 160px
   *   detail — 192px
   */
  variant?: 'card' | 'list' | 'grid' | 'detail';
  /** Optional label shown next to the IVLoader dots. */
  label?: string;
}

export function LoadingSkeleton({
  className,
  // count is intentionally ignored — see prop doc above
  variant = 'card',
  label,
}: LoadingSkeletonProps) {
  const getMinHeight = () => {
    switch (variant) {
      case 'card':   return 'min-h-[128px]';
      case 'list':   return 'min-h-[80px]';
      case 'grid':   return 'min-h-[160px]';
      case 'detail': return 'min-h-[192px]';
      default:       return 'min-h-[128px]';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl',
        'bg-[var(--surface-1)]/50',
        'border border-[var(--border-subtle)]',
        getMinHeight(),
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <IVLoader size="lg" label={label} />
    </div>
  );
}