import { cn } from '@/lib/utils/cn';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  message: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
  className?: string;
}

const TONE_CLASS: Record<NonNullable<ActivityEntry['tone']>, string> = {
  default: 'text-[var(--text-secondary)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  error: 'text-[var(--error)]',
};

export function ActivityFeed({ entries, className }: ActivityFeedProps) {
  if (entries.length === 0) return null;
  return (
    <ul className={cn('activity-feed', className)}>
      {entries.map((e) => (
        <li key={e.id} className="activity-feed__item">
          <span className="activity-feed__time">{e.timestamp}</span>
          <span
            className={cn(
              'activity-feed__message',
              TONE_CLASS[e.tone ?? 'default']
            )}
          >
            {e.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
