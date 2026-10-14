import { cn } from '@/lib/utils/cn';
import { Bot, Loader2, Clock, AlertCircle} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'working' | 'idle' | 'blocked' | 'waiting';
  currentTask?: string;
  progress?: number;
  onClick?: () => void;
}

interface AITeamProps {
  members: TeamMember[];
  className?: string;
  maxItems?: number;
  emptyMessage?: string;
}

// Use functions to get icons and status configs
function getStatusIcon(status: string) {
  switch (status) {
    case 'working': return <Loader2 className="h-3.5 w-3.5" />;
    case 'idle': return <Clock className="h-3.5 w-3.5" />;
    case 'blocked': return <AlertCircle className="h-3.5 w-3.5" />;
    case 'waiting': return <Clock className="h-3.5 w-3.5" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'working': return 'text-blue-500';
    case 'idle': return 'text-muted-foreground';
    case 'blocked': return 'text-red-500';
    case 'waiting': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'working': return 'bg-blue-500 animate-pulse';
    case 'idle': return 'bg-gray-400';
    case 'blocked': return 'bg-red-500';
    case 'waiting': return 'bg-amber-500';
    default: return 'bg-gray-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'working': return 'Working';
    case 'idle': return 'Idle';
    case 'blocked': return 'Blocked';
    case 'waiting': return 'Waiting';
    default: return 'Idle';
  }
}

export function AITeam({
  members,
  className,
  maxItems = 4,
  emptyMessage = 'No agents active.'
}: AITeamProps) {
  const displayMembers = members.slice(0, maxItems);

  if (displayMembers.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {displayMembers.map((member) => {
        const statusIcon = getStatusIcon(member.status);
        const statusColor = getStatusColor(member.status);
        const statusDot = getStatusDotColor(member.status);
        const statusLabel = getStatusLabel(member.status);

        return (
          <div
            key={member.id}
            onClick={member.onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm',
              member.onClick && 'cursor-pointer hover:bg-accent/50'
            )}
          >
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                statusDot
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{member.name}</p>
                <span className="text-xs text-muted-foreground">· {member.role}</span>
              </div>
              {member.currentTask && (
                <p className="text-sm text-muted-foreground truncate">
                  {member.currentTask}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {member.progress !== undefined && (
                <div className="w-12 h-1 rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(member.progress, 100)}%` }}
                  />
                </div>
              )}
              <span className={cn('flex items-center gap-1 text-xs', statusColor)}>
                {statusIcon}
                {statusLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
