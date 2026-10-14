import { cn } from '@/lib/utils/cn';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  createdAt: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NeedsAttentionProps {
  items: AttentionItem[];
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

const severityConfigs = {
  critical: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Critical'
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Warning'
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Info'
  },
};

export function NeedsAttention({
  items,
  className,
  emptyMessage = 'All systems clear.',
  maxItems
}: NeedsAttentionProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

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
        const config = severityConfigs[item.severity] || severityConfigs.info;

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
              {item.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-sm gap-1"
                  onClick={item.action.onClick}
                >
                  {item.action.label}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="shrink-0 text-xs text-muted-foreground">
              {item.createdAt}
            </div>
          </div>
        );
      })}
    </div>
  );
}
