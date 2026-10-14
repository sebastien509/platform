import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface NextStepProps {
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: ReactNode;
}

export function NextStep({
  description,
  actionLabel = 'Continue',
  onAction,
  className,
  icon
}: NextStepProps) {
  return (
    <div className={cn(
      'rounded-lg border border-primary/20 bg-primary/5 p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-primary">
          {icon || <Sparkles className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Next</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {onAction && (
          <Button size="sm" className="gap-1" onClick={onAction}>
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
