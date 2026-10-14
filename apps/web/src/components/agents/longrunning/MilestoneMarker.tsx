import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type MilestoneStatus = 'pending' | 'active' | 'complete';

interface MilestoneMarkerProps {
  label: string;
  status: MilestoneStatus;
  detail?: string;
  className?: string;
}

export function MilestoneMarker({
  label,
  status,
  detail,
  className,
}: MilestoneMarkerProps) {
  const Icon =
    status === 'complete'
      ? CheckCircle2
      : status === 'active'
      ? Loader2
      : Circle;

  return (
    <div className={cn('milestone', `milestone--${status}`, className)}>
      <Icon
        className={cn(
          'milestone__icon',
          status === 'active' && 'animate-spin motion-reduce:animate-none'
        )}
        aria-hidden="true"
      />
      <div className="milestone__text">
        <span className="milestone__label">{label}</span>
        {detail && <span className="milestone__detail">{detail}</span>}
      </div>
    </div>
  );
}
