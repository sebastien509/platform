import { cn } from '@/lib/utils/cn';

interface StackProgressProps {
  current: number;   // 1-indexed
  total: number;
  className?: string;
}

export function StackProgress({ current, total, className }: StackProgressProps) {
  if (total <= 1) return null;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      aria-label={`Decision ${current} of ${total}`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i < current - 1 && 'w-1.5 bg-[var(--success)]',
              i === current - 1 && 'w-4 bg-[var(--accent)]',
              i > current - 1 && 'w-1.5 bg-[var(--surface-3)]'
            )}
          />
        ))}
      </div>
      <span className="text-2xs tabular-nums text-[var(--text-muted)]">
        {current} of {total}
      </span>
    </div>
  );
}
