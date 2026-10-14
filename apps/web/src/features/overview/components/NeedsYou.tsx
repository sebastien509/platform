import { cn } from '@/lib/utils/cn';
import { AlertCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  action: {
    label: string;
    onClick: () => void;
  };
}

interface NeedsYouProps {
  items: ActionItem[];
  className?: string;
  maxItems?: number;
  emptyMessage?: string;
}

const priorityConfigs = {
  critical: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Critical'
  },
  high: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'High'
  },
  medium: {
    icon: <Clock className="h-4 w-4" />,
    className: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Medium'
  },
  low: {
    icon: <Clock className="h-4 w-4" />,
    className: 'border-gray-200 bg-gray-50 dark:bg-gray-800/30 dark:border-gray-700',
    iconColor: 'text-muted-foreground',
    label: 'Low'
  },
};

export function NeedsYou({
  items,
  className,
  maxItems = 4,
  emptyMessage = 'No pending decisions.'
}: NeedsYouProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <div className="text-2xl mb-2">✅</div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayItems.map((item) => {
        const config = priorityConfigs[item.priority] || priorityConfigs.medium;

        return (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-all',
              config.className
            )}
          >
            <div className={cn('mt-0.5', config.iconColor)}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{item.title}</p>
                <span className="text-xs text-muted-foreground">· {item.source}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>

            <Button
              size="sm"
              className="shrink-0 gap-1"
              onClick={item.action.onClick}
            >
              {item.action.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
