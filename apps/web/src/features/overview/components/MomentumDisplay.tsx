import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus} from 'lucide-react';

type MomentumType = 'improving' | 'stable' | 'declining';

interface MomentumDisplayProps {
  momentum: MomentumType;
  value: number;
  change?: number;
  wins?: number;
  className?: string;
}

const configs = {
  improving: {
    icon: <TrendingUp className="h-5 w-5" />,
    label: 'Improving',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  stable: {
    icon: <Minus className="h-5 w-5" />,
    label: 'Stable',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  declining: {
    icon: <TrendingDown className="h-5 w-5" />,
    label: 'Needs Attention',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

export function MomentumDisplay({
  momentum,
  value,
  change,
  wins = 0,
  className
}: MomentumDisplayProps) {
  const config = configs[momentum] || configs.stable;

  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center gap-4">
        <div className={cn('rounded-full p-2', config.bgColor)}>
          {config.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={cn('text-lg font-semibold', config.color)}>
              {value}%
            </span>
            <span className={cn('text-sm font-medium', config.color)}>
              {config.label}
            </span>
            {change !== undefined && (
              <span className="text-xs text-muted-foreground">
                {change > 0 ? '+' : ''}{change}% this week
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {wins > 0 ? `${wins} win${wins > 1 ? 's' : ''} this week` : 'Building momentum'}
          </p>
        </div>

        {wins > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{wins}
            </p>
            <p className="text-xs text-muted-foreground">wins</p>
          </div>
        )}
      </div>
    </div>
  );
}
