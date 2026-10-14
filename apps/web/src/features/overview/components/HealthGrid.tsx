import { cn } from '@/lib/utils/cn';
import { getHealthColor } from '@/lib/hooks/useHealth';
import { Progress } from '@/components/ui/progress';

interface HealthDimension {
  key: string;
  label: string;
  value: number;
  status: 'critical' | 'needs_attention' | 'good' | 'excellent';
  description: string;
}

interface HealthGridProps {
  dimensions: HealthDimension[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const statusBadgeColors: Record<string, string> = {
  critical:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  needs_attention:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  good:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  excellent:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const statusLabels: Record<string, string> = {
  critical: 'Critical',
  needs_attention: 'Needs Attention',
  good: 'Good',
  excellent: 'Excellent',
};

export function HealthGrid({
  dimensions,
  className,
  columns = 3,
}: HealthGridProps) {
  const gridCols: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {dimensions.map((dim) => {
        const color = getHealthColor(dim.value);
        const badgeColor =
          statusBadgeColors[dim.status] ??
          statusBadgeColors.needs_attention;

        return (
          <div
            key={dim.key}
            className="rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {dim.label}
              </p>
              <span className={cn('text-xs font-medium', color)}>
                {dim.value}%
              </span>
            </div>

            <div className="mt-1.5">
              <Progress value={dim.value} className="h-1.5" />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground truncate">
                {dim.description}
              </p>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                  badgeColor
                )}
              >
                {statusLabels[dim.status] ?? dim.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
