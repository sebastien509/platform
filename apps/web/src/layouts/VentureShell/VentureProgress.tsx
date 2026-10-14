import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Circle, CircleDot, Loader2 } from 'lucide-react';

export type JourneyStage = 'overview' | 'build' | 'launch' | 'grow' | 'learn';

export interface Stage {
  id: JourneyStage;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const STAGES: Stage[] = [
  { id: 'overview', label: 'Overview', description: 'Where we are', icon: null },
  { id: 'build', label: 'Build', description: 'What we\'re building', icon: null },
  { id: 'launch', label: 'Launch', description: 'How we reach the market', icon: null },
  { id: 'grow', label: 'Grow', description: 'Is it working?', icon: null },
  { id: 'learn', label: 'Learn', description: 'What did we learn?', icon: null },
];

interface VentureProgressProps {
  currentStage: JourneyStage;
  stageProgress?: Partial<Record<JourneyStage, number>>;
  className?: string;
  compact?: boolean;
}

export function VentureProgress({
  currentStage,
  stageProgress = {} as Record<JourneyStage, number> as Partial<Record<JourneyStage, number>>,
  className,
  compact = false
}: VentureProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  const getStatus = (index: number) => {
    if (index < currentIndex) return 'complete';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-1">
        {STAGES.map((stage, index) => {
          const status = getStatus(index);
          const progress = stageProgress[stage.id] || 0;
          const isLast = index === STAGES.length - 1;

          return (
            <div key={stage.id} className="flex-1">
              <div className="flex items-center">
                {/* Stage Indicator */}
                <div className="flex flex-col items-center flex-1">
                  {/* Progress bar */}
                  <div className="w-full flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-[var(--surface-2)]">
                      {index > 0 && (
                        <div
                          className={cn(
                            'h-1 rounded-full transition-all duration-500',
                            status === 'complete' ? 'bg-green-500' :
                            status === 'active' ? 'bg-[var(--accent)]' :
                            'bg-[var(--surface-2)]'
                          )}
                          style={{
                            width: status === 'complete' ? '100%' :
                                   status === 'active' ? `${Math.max(progress, 10)}%` :
                                   '0%'
                          }}
                        />
                      )}
                    </div>

                    {/* Dot */}
                    <div className="flex-shrink-0">
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : status === 'active' ? (
                        <div className="relative">
                          <CircleDot className="h-5 w-5 text-primary animate-pulse" />
                          <Loader2 className="absolute inset-0 h-5 w-5 animate-spin text-primary/30" />
                        </div>
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--text-muted)]/30" />
                      )}
                    </div>

                    {/* Next line */}
                    {!isLast && (
                      <div className="flex-1 h-1 rounded-full bg-[var(--surface-2)]">
                        <div
                          className={cn(
                            'h-1 rounded-full transition-all duration-500',
                            status === 'complete' ? 'bg-green-500' :
                            status === 'active' ? 'bg-[var(--accent-muted)]' :
                            'bg-[var(--surface-2)]'
                          )}
                          style={{
                            width: status === 'complete' ? '100%' :
                                   status === 'active' ? '50%' :
                                   '0%'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  {!compact && (
                    <div className="mt-2 text-center">
                      <p className={cn(
                        'text-xs font-medium transition-colors',
                        status === 'active' ? 'text-primary' :
                        status === 'complete' ? 'text-[var(--text-muted)]' :
                        'text-[var(--text-muted)]/50'
                      )}>
                        {stage.label}
                      </p>
                      {status === 'active' && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {progress > 0 ? `${Math.round(progress)}%` : 'Started'}
                        </p>
                      )}
                      {status === 'complete' && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          ✓ Done
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
