import { cn } from '@/lib/utils/cn';

export type ToolCallStatus = 'pending' | 'running' | 'complete' | 'failed';

interface ToolCallTimingProps {
  status: ToolCallStatus;
  duration?: number;
  className?: string;
}

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  complete: 'Completed',
  failed: 'Failed',
};

const STATUS_CLASS: Record<ToolCallStatus, string> = {
  pending: 'text-[var(--text-muted)]',
  running: 'text-[var(--info)]',
  complete: 'text-[var(--success)]',
  failed: 'text-[var(--error)]',
};

export function ToolCallTiming({
  status,
  duration,
  className,
}: ToolCallTimingProps) {
  return (
    <span
      className={cn('tool-call__timing', STATUS_CLASS[status], className)}
    >
      {STATUS_LABEL[status]}
      {duration !== undefined && (
        <span className="text-[var(--text-muted)]"> · {duration}s</span>
      )}
    </span>
  );
}
