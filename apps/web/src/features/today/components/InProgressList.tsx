import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2, CheckCircle2, Clock, Bot, Briefcase, Megaphone } from 'lucide-react';

export interface InProgressItem {
  id: string;
  title: string;
  description: string;
  type: 'agent' | 'workflow' | 'build' | 'campaign';
  status: 'running' | 'waiting' | 'completed' | 'blocked';
  progress?: number;
  source: string;
  onClick?: () => void;
}

interface InProgressListProps {
  items: InProgressItem[];
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

const statusConfigs: Record<string, { icon: ReactNode; label: string; className: string }> = {
  running: { icon: <Loader2 className="h-3.5 w-3.5" />, label: 'Running', className: 'text-blue-500' },
  waiting: { icon: <Clock className="h-3.5 w-3.5" />, label: 'Waiting', className: 'text-amber-500' },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Done', className: 'text-green-500' },
  blocked: { icon: <Clock className="h-3.5 w-3.5" />, label: 'Blocked', className: 'text-red-500' },
};

// Use a function to get icons, not storing JSX directly in objects
function getTypeIcon(type: string) {
  switch (type) {
    case 'agent': return <Bot className="h-4 w-4" />;
    case 'workflow': return <Briefcase className="h-4 w-4" />;
    case 'build': return <Loader2 className="h-4 w-4" />;
    case 'campaign': return <Megaphone className="h-4 w-4" />;
    default: return <Briefcase className="h-4 w-4" />;
  }
}

export function InProgressList({
  items,
  className,
  emptyMessage = 'Nothing in progress right now.',
  maxItems
}: InProgressListProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  if (displayItems.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <div className="text-2xl mb-2">🔄</div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayItems.map((item) => {
        const status = statusConfigs[item.status] || statusConfigs.running;
        const Icon = getTypeIcon(item.type);

        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm',
              item.onClick && 'cursor-pointer hover:bg-accent/50'
            )}
          >
            <div className="shrink-0 text-muted-foreground">
              {Icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <span className="text-xs text-muted-foreground">· {item.source}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {item.progress !== undefined && (
                <div className="w-16 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
              )}
              <span className={cn('flex items-center gap-1 text-xs', status.className)}>
                {status.icon}
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
