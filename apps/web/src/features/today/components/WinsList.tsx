import { cn } from '@/lib/utils/cn';
import { TrendingUp, Users, DollarSign, Award, CheckCircle2 } from 'lucide-react';

export interface Win {
  id: string;
  title: string;
  description: string;
  value?: string;
  type: 'metric' | 'milestone' | 'customer' | 'revenue' | 'product';
  source: string;
  createdAt: string;
  onClick?: () => void;
}

interface WinsListProps {
  wins: Win[];
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

// Use functions to get icons, not storing JSX directly in objects
function getTypeIcon(type: string) {
  switch (type) {
    case 'metric': return <TrendingUp className="h-4 w-4" />;
    case 'milestone': return <Award className="h-4 w-4" />;
    case 'customer': return <Users className="h-4 w-4" />;
    case 'revenue': return <DollarSign className="h-4 w-4" />;
    case 'product': return <CheckCircle2 className="h-4 w-4" />;
    default: return <Award className="h-4 w-4" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'metric': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    case 'milestone': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
    case 'customer': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    case 'revenue': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    case 'product': return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30';
    default: return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
  }
}

export function WinsList({
  wins,
  className,
  emptyMessage = 'No wins yet. Keep building!',
  maxItems
}: WinsListProps) {
  const displayWins = maxItems ? wins.slice(0, maxItems) : wins;

  if (displayWins.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <div className="text-2xl mb-2">🏆</div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayWins.map((win) => {
        const Icon = getTypeIcon(win.type);
        const color = getTypeColor(win.type);

        return (
          <div
            key={win.id}
            onClick={win.onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm',
              win.onClick && 'cursor-pointer hover:bg-accent/50'
            )}
          >
            <div className={cn('rounded-lg p-1.5', color)}>
              {Icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{win.title}</p>
              <p className="text-xs text-muted-foreground">{win.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {win.value && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {win.value}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{win.createdAt}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
