import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';
import { HealthDimensionSummary } from './HealthGridCollapsed';

interface HealthGridExpandedProps {
  dimensions: HealthDimensionSummary[];
  className?: string;
}

const STATUS_LABEL: Record<HealthDimensionSummary['status'], string> = {
  critical: 'Critical',
  needs_attention: 'Needs attention',
  good: 'Good',
  excellent: 'Excellent',
};

export function HealthGridExpanded({
  dimensions,
  className,
}: HealthGridExpandedProps) {
  return (
    <div className={cn('health-expanded', className)}>
      {dimensions.map((d) => (
        <div key={d.key} className="health-expanded__row">
          <div className="health-expanded__label-row">
            <span className="health-expanded__label">{d.label}</span>
            <span className="health-expanded__value">{d.value}%</span>
          </div>
          <Progress value={d.value} className="h-1.5" />
          <span className="health-expanded__status">
            {STATUS_LABEL[d.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
