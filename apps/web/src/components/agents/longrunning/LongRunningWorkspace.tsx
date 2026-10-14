import { useState } from 'react';
import { InlineExpand } from '@/components/containers';
import { MilestoneMarker, MilestoneStatus } from './MilestoneMarker';
import { ActivityFeed, ActivityEntry } from './ActivityFeed';
import { cn } from '@/lib/utils/cn';

interface LongRunningWorkspaceProps {
  day: number;
  totalDays: number;
  milestones: Array<{
    id: string;
    label: string;
    status: MilestoneStatus;
    detail?: string;
  }>;
  entries: ActivityEntry[];
  className?: string;
}

export function LongRunningWorkspace({
  day,
  totalDays,
  milestones,
  entries,
  className,
}: LongRunningWorkspaceProps) {
  const [open] = useState(false);
  const complete = milestones.filter((m) => m.status === 'complete').length;
  const total = milestones.length;

  return (
    <div className={cn('long-running', className)}>
      <InlineExpand
        trigger={
          <span className="long-running__strip">
            <span className="long-running__badge">
              Day {day} of {totalDays}
            </span>
            <span className="long-running__summary">
              {complete} of {total} milestones complete
            </span>
          </span>
        }
        defaultOpen={open}
      >
        <div className="long-running__body">
          <div className="long-running__milestones">
            {milestones.map((m) => (
              <MilestoneMarker
                key={m.id}
                label={m.label}
                status={m.status}
                detail={m.detail}
              />
            ))}
          </div>
          {entries.length > 0 && (
            <div className="long-running__feed">
              <span className="long-running__feed-label">Live activity</span>
              <ActivityFeed entries={entries.slice(0, 8)} />
            </div>
          )}
        </div>
      </InlineExpand>
    </div>
  );
}
