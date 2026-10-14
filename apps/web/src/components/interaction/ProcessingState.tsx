import { cn } from '@/lib/utils/cn';
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';

type ProcessingStateType = 'idle' | 'active' | 'complete' | 'error';

interface ProcessingStateProps {
  state: ProcessingStateType;
  message: string;
  className?: string;
  showIcon?: boolean;
}

const configs: Record<ProcessingStateType, { icon: React.ReactNode; className: string }> = {
  idle: { icon: <Clock className="h-4 w-4 text-muted-foreground" />, className: 'text-muted-foreground' },
  active: { icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />, className: 'text-blue-600 dark:text-blue-400' },
  complete: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, className: 'text-green-600 dark:text-green-400' },
  error: { icon: <XCircle className="h-4 w-4 text-red-500" />, className: 'text-red-600 dark:text-red-400' },
};

export function ProcessingState({ state, message, className, showIcon = true }: ProcessingStateProps) {
  const config = configs[state] || configs.idle;

  return (
    <div className={cn('flex items-center gap-2 py-1 text-sm', config.className, className)}>
      {showIcon && config.icon}
      <span className={state === 'active' ? 'font-medium' : ''}>{message}</span>
      {state === 'active' && (
        <span className="text-xs text-muted-foreground ml-1">...</span>
      )}
    </div>
  );
}
