import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';

type ActivityStatus = 'pending' | 'active' | 'complete' | 'error' | 'skipped';

interface ActivityItem {
  label: string;
  status: ActivityStatus;
  description?: string;
}

interface ActivityTraceProps {
  items: ActivityItem[];
  className?: string;
  compact?: boolean;
}

const statusConfigs: Record<ActivityStatus, { icon: React.ReactNode; className: string; dotColor: string }> = {
  pending: { 
    icon: <Clock className="h-3.5 w-3.5" />, 
    className: 'text-muted-foreground',
    dotColor: 'bg-gray-300 dark:bg-gray-600'
  },
  active: { 
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, 
    className: 'text-blue-500',
    dotColor: 'bg-blue-500 animate-pulse'
  },
  complete: { 
    icon: <CheckCircle2 className="h-3.5 w-3.5" />, 
    className: 'text-green-500',
    dotColor: 'bg-green-500'
  },
  error: { 
    icon: <XCircle className="h-3.5 w-3.5" />, 
    className: 'text-red-500',
    dotColor: 'bg-red-500'
  },
  skipped: { 
    icon: <Clock className="h-3.5 w-3.5" />, 
    className: 'text-muted-foreground/50',
    dotColor: 'bg-gray-200 dark:bg-gray-700'
  },
};

export function ActivityTrace({ items, className, compact = false }: ActivityTraceProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const config = statusConfigs[item.status] || statusConfigs.pending;
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-start gap-3">
            {/* Timeline line */}
            <div className="relative flex flex-col items-center">
              <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
              {!isLast && (
                <div className="absolute top-3 h-full w-px bg-border" />
              )}
            </div>

            <div className={cn('flex-1', compact ? 'py-0.5' : 'py-1')}>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm', config.className)}>
                  {item.label}
                </span>
                {!compact && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.status}
                  </span>
                )}
              </div>
              {item.description && !compact && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>

            {!compact && (
              <div className={cn('shrink-0', config.className)}>
                {config.icon}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
