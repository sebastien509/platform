import { Button } from '@/components/ui/button';
import { RotateCw, ArrowUpRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FailureRecoveryProps {
  onRetry?: () => void;
  onEscalate?: () => void;
  onIgnore?: () => void;
  onViewTrace?: () => void;
  className?: string;
}

export function FailureRecovery({
  onRetry,
  onEscalate,
  onIgnore,
  onViewTrace,
  className,
}: FailureRecoveryProps) {
  return (
    <div className={cn('failure-recovery', className)}>
      {onRetry && (
        <Button size="sm" onClick={onRetry} className="gap-1">
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
      {onEscalate && (
        <Button size="sm" variant="outline" onClick={onEscalate} className="gap-1">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Escalate
        </Button>
      )}
      {onIgnore && (
        <Button size="sm" variant="ghost" onClick={onIgnore}>
          Ignore
        </Button>
      )}
      {onViewTrace && (
        <Button
          size="sm"
          variant="link"
          onClick={onViewTrace}
          className="ml-auto gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          View full trace
        </Button>
      )}
    </div>
  );
}
