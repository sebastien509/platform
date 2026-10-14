import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ActivityItem {
  id: string;
  icon?: ReactNode;
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

interface ActivityStripProps {
  items: ActivityItem[];
  onViewAll?: () => void;
  maxVisible?: number;
  className?: string;
}

const TONE_COLOR: Record<NonNullable<ActivityItem['tone']>, string> = {
  default: 'var(--text-secondary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
};

export function ActivityStrip({
  items,
  onViewAll,
  maxVisible = 4,
  className,
}: ActivityStripProps) {
  const visible = items.slice(0, maxVisible);
  const moreCount = items.length - visible.length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('activity-strip', className)}>
      {visible.map((item, i) => (
        <div key={item.id} className="activity-strip__item">
          {i > 0 && <span className="activity-strip__divider" aria-hidden />}
          <span
            className="activity-strip__icon"
            style={{ color: TONE_COLOR[item.tone ?? 'default'] }}
          >
            {item.icon}
          </span>
          <span className="activity-strip__label">{item.label}</span>
        </div>
      ))}
      {moreCount > 0 && (
        <button
          type="button"
          className="activity-strip__more"
          onClick={onViewAll}
        >
          +{moreCount} more
        </button>
      )}
    </div>
  );
}
