import { Agent } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/format';

interface AgentActivityFeedProps {
  agents: Agent[];
  className?: string;
}

export function AgentActivityFeed({ agents, className }: AgentActivityFeedProps) {
  const activities = agents.flatMap((agent) =>
    agent.activity.slice(0, 3).map((activity) => ({
      ...activity,
      agentName: agent.name,
      agentRole: agent.role,
    }))
  );

  // Sort by timestamp, most recent first
  const sortedActivities = activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedActivities.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No recent agent activity.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sortedActivities.slice(0, 5).map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {activity.agentName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.agentName}</span>
              <span className="text-muted-foreground"> {activity.action}</span>
            </p>
            <p className="text-sm text-muted-foreground line-clamp-1">{activity.result}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTime(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
