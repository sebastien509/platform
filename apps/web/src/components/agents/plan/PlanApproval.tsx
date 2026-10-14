import { Button } from '@/components/ui/button';
import { Plus, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PlanApprovalProps {
  onAddStep?: () => void;
  onApprove?: () => void;
  onStop?: () => void;
  approved?: boolean;
  className?: string;
}

export function PlanApproval({
  onAddStep,
  onApprove,
  onStop,
  approved = false,
  className,
}: PlanApprovalProps) {
  return (
    <div className={cn('plan-approval', className)}>
      {!approved && onAddStep && (
        <Button variant="ghost" size="sm" onClick={onAddStep} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add step
        </Button>
      )}
      <div className="plan-approval__spacer" />
      {!approved && onApprove && (
        <Button size="sm" onClick={onApprove} className="gap-1">
          <Play className="h-3.5 w-3.5" />
          Approve plan
        </Button>
      )}
      {approved && onStop && (
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          className="gap-1 text-[var(--error)] hover:text-[var(--error)]"
        >
          <Square className="h-3.5 w-3.5" />
          Stop
        </Button>
      )}
    </div>
  );
}
