import { CheckpointStatus } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface CheckpointStatusBadgeProps {
  status: CheckpointStatus;
}

const STATUS_CONFIG: Record<CheckpointStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  stale: { label: 'Stale', className: 'bg-gray-100 text-gray-700' },
};

export function CheckpointStatusBadge({ status }: CheckpointStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
