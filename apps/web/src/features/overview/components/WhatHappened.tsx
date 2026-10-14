import { cn } from '@/lib/utils/cn';
import { CheckCircle2, TrendingUp, Users, DollarSign, Award, Clock } from 'lucide-react';

interface HappeningItem {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'metric' | 'customer' | 'revenue' | 'product' | 'experiment';
  value?: string;
  timestamp: string;
  onClick?: () => void;
}

interface WhatHappenedProps {
  items: HappeningItem[];
  className?: string;
  maxItems?: number;
  emptyMessage?: string;
}

// Use functions to get icons, not storing JSX directly in objects
function getTypeIcon(type: string) {
  switch (type) {
    case 'milestone': return <Award className="h-4 w-4" />;
    case 'metric': return <TrendingUp className="h-4 w-4" />;
    case 'customer': return <Users className="h-4 w-4" />;
    case 'revenue': return <DollarSign className="h-4 w-4" />;
    case 'product': return <CheckCircle2 className="h-4 w-4" />;
    case 'experiment': return <Clock className="h-4 w-4" />;
    default: return <Award className="h-4 w-4" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'milestone': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
    case 'metric': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    case 'customer': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    case 'revenue': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    case 'product': return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30';
    case 'experiment': return 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30';
    default: return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
  }
}

export function WhatHappened({
  items,
  className,
  maxItems = 5,
  emptyMessage = 'No recent activity.'
}: WhatHappenedProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayItems.map((item) => {
        const Icon = getTypeIcon(item.type);
        const color = getTypeColor(item.type);

        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm',
              item.onClick && 'cursor-pointer hover:bg-accent/50'
            )}
          >
            <div className={cn('rounded-lg p-1.5', color)}>
              {Icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.value && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {item.value}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
