import { cn } from '@/lib/utils/cn';
import type { IdeaListStatus } from '@/lib/types';
import { STATUS_LABELS } from './listStatus';

/**
 * IdeaStatusBadge — status pill on the ideas list.
 *
 * Tone mapping:
 *   killed       → red (terminal, negative)
 *   validated    → green (terminal, positive)
 *   ready_to_*   → accent (needs action)
 *   in-progress  → muted (info)
 */
const TONE: Record<IdeaListStatus, 'red' | 'green' | 'accent' | 'muted'> = {
  killed: 'red',
  validated: 'green',
  ready_to_validate: 'accent',
  awaiting_review: 'accent',
  capturing: 'muted',
  researching: 'muted',
  refining: 'muted',
};

interface IdeaStatusBadgeProps {
  status: IdeaListStatus;
  className?: string;
}

export function IdeaStatusBadge({ status, className }: IdeaStatusBadgeProps) {
  const tone = TONE[status] ?? 'muted';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        'idea-status-badge',
        `is-${tone}`,
        className
      )}
    >
      {label}
    </span>
  );
}
