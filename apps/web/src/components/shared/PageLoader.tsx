import { cn } from '@/lib/utils/cn';
import { IVLoader } from '@/features/loading';

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export function PageLoader({ label = 'Loading', className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[60vh] w-full items-center justify-center',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <IVLoader size="lg" label={label} />
    </div>
  );
}