import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ChannelMetric {
  id: string;
  name: string;
  type: 'organic' | 'paid' | 'social' | 'email' | 'referral' | 'direct';
  reach: number;
  engagement: number;
  conversion: number;
  cost?: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ChannelPerformanceProps {
  channels: ChannelMetric[];
  className?: string;
  maxItems?: number;
}

const typeColors = {
  organic: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  paid: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  social: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  email: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  referral: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30',
  direct: 'text-gray-500 bg-gray-100 dark:bg-gray-800/30',
};

const trendIcons = {
  up: <TrendingUp className="h-3.5 w-3.5 text-green-500" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-red-500" />,
  stable: <Minus className="h-3.5 w-3.5 text-amber-500" />,
};

export function ChannelPerformance({
  channels,
  className,
  maxItems = 5
}: ChannelPerformanceProps) {
  const [expanded, setExpanded] = useState(false);
  const displayChannels = expanded ? channels : channels.slice(0, maxItems);

  if (channels.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-6 text-center', className)}>
        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No channel data yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayChannels.map((channel) => {
        const color = typeColors[channel.type] || typeColors.direct;
        const conversionRate = channel.reach > 0 ? (channel.conversion / channel.reach) * 100 : 0;

        return (
          <div
            key={channel.id}
            className="rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('rounded-lg p-1', color)}>
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-sm">{channel.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {channel.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm">
                  {trendIcons[channel.trend]}
                  {channel.change > 0 ? '+' : ''}{channel.change}%
                </span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Reach</p>
                <p className="font-medium">{channel.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Engagement</p>
                <p className="font-medium">{channel.engagement}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversion</p>
                <p className="font-medium">{conversionRate.toFixed(1)}%</p>
              </div>
              {channel.cost !== undefined && (
                <div>
                  <p className="text-muted-foreground">Cost</p>
                  <p className="font-medium">${channel.cost.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Performance</span>
                <span>{Math.round(conversionRate)}%</span>
              </div>
              <Progress value={Math.min(conversionRate * 10, 100)} className="h-1" />
            </div>
          </div>
        );
      })}

      {channels.length > maxItems && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Show less' : `Show ${channels.length - maxItems} more channels`}
        </button>
      )}
    </div>
  );
}
