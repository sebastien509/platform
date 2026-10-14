import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Bot,
  FileText} from 'lucide-react';

export interface AgentTimelineEvent {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'waiting' | 'approved' | 'rejected';
  result?: string;
  artifactId?: string;
  timestamp: string;
}

interface AgentStatusTimelineProps {
  events: AgentTimelineEvent[];
  className?: string;
  maxItems?: number;
}

const eventConfig = {
  started: { icon: <Clock className="h-4 w-4 text-blue-500" />, color: 'border-blue-500' },
  in_progress: { icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />, color: 'border-blue-500' },
  completed: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-green-500' },
  failed: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'border-red-500' },
  waiting: { icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'border-amber-500' },
  approved: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-green-500' },
  rejected: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'border-red-500' }
};

export function AgentStatusTimeline({ events, className, maxItems = 10 }: AgentStatusTimelineProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm">No agent activity yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {displayEvents.map((event, index) => {
        const config = eventConfig[event.status] || eventConfig.started;
        const isLast = index === displayEvents.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4 pb-4">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-[15px] top-[30px] h-full w-px bg-border" />
            )}

            {/* Dot */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card">
              <div className={cn('h-3 w-3 rounded-full border-2', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.agentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(event.timestamp)}
                </span>
              </div>

              {event.result && (
                <div className="mt-1 rounded-lg bg-muted/30 p-2 text-sm">
                  {event.result}
                </div>
              )}

              {event.artifactId && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Artifact: {event.artifactId}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {events.length > maxItems && (
        <div className="text-center text-sm text-muted-foreground pt-2">
          +{events.length - maxItems} more events
        </div>
      )}
    </div>
  );
}
