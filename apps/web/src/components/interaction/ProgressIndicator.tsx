import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';

interface Step {
  label: string;
  status: 'complete' | 'active' | 'pending';
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
  compact?: boolean;
}

export function ProgressIndicator({ steps, className, compact = false }: ProgressIndicatorProps) {
  const getIcon = (status: Step['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'active': return <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse" />;
      default: return <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {getIcon(step.status)}
            {!compact && (
              <span className={cn(
                'text-xs font-medium',
                step.status === 'active' ? 'text-primary' :
                step.status === 'complete' ? 'text-muted-foreground' :
                'text-muted-foreground/60'
              )}>
                {step.label}
              </span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'h-px w-4',
              steps[index + 1].status === 'pending' ? 'bg-muted' : 'bg-primary/30'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
