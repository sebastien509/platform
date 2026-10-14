import { Phase } from '@/lib/types';
import { PHASE_LABELS, PHASE_ORDER } from '@/lib/utils/phaseHelpers';
import { cn } from '@/lib/utils/cn';

interface PhaseProgressProps {
  currentPhase: Phase;
  className?: string;
}

export function PhaseProgress({ currentPhase, className }: PhaseProgressProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {PHASE_ORDER.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                isComplete && 'bg-green-500 text-white',
                isCurrent && 'bg-primary text-primary-foreground',
                isFuture && 'bg-muted text-muted-foreground'
              )}
            >
              {isComplete ? '✓' : index + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                isComplete && 'text-green-600',
                isCurrent && 'text-primary',
                isFuture && 'text-muted-foreground'
              )}
            >
              {PHASE_LABELS[phase]}
            </span>
            {index < PHASE_ORDER.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4',
                  index < currentIndex ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
