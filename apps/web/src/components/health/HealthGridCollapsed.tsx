import { cn } from '@/lib/utils/cn';

export interface HealthDimensionSummary {
  key: string;
  label: string;
  value: number;
  status: 'critical' | 'needs_attention' | 'good' | 'excellent';
}

interface HealthGridCollapsedProps {
  dimensions: HealthDimensionSummary[];
  onExpand: () => void;
  className?: string;
}

const STATUS_COLOR: Record<HealthDimensionSummary['status'], string> = {
  critical: 'var(--error)',
  needs_attention: 'var(--warning)',
  good: 'var(--success)',
  excellent: 'var(--success)',
};

export function HealthGridCollapsed({
  dimensions,
  onExpand,
  className,
}: HealthGridCollapsedProps) {
  const needsAttention = dimensions.filter(
    (d) => d.status === 'critical' || d.status === 'needs_attention'
  ).length;

  const summary =
    needsAttention > 0
      ? `${needsAttention} ${needsAttention === 1 ? 'area needs' : 'areas need'} attention`
      : 'All tracking well.';

  return (
    <button
      type="button"
      className={cn('health-collapsed', className)}
      onClick={onExpand}
      aria-label={`View full health grid. ${summary}`}
    >
      <div className="health-collapsed__dots">
        {dimensions.map((d) => (
          <span
            key={d.key}
            className="health-collapsed__dot"
            style={{ background: STATUS_COLOR[d.status] }}
            title={d.label}
          />
        ))}
      </div>
      <span className="health-collapsed__summary">{summary}</span>
    </button>
  );
}
