import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Megaphone, Mail, Share2, TrendingUp, DollarSign, Clock, XCircle, ChevronDown, ChevronUp, Calendar, Users, Eye, Edit, Rocket } from 'lucide-react';
import { Campaign } from './CampaignList';

interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
  onClick?: () => void;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons = {
  email: <Mail className="h-3.5 w-3.5" />,
  social: <Share2 className="h-3.5 w-3.5" />,
  content: <Megaphone className="h-3.5 w-3.5" />,
  paid: <DollarSign className="h-3.5 w-3.5" />,
  outbound: <Users className="h-3.5 w-3.5" />,
  experiment: <TrendingUp className="h-3.5 w-3.5" />,
};

const typeColors = {
  email: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  social: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  content: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  outbound: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  experiment: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export function CampaignCard({ campaign, className, onClick }: CampaignCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = statusColors[campaign.status] || statusColors.planning;
  const Icon = typeIcons[campaign.type] || typeIcons.content;
  const color = typeColors[campaign.type] || typeColors.content;
  const isActive = campaign.status === 'active';

  const progress = campaign.metrics?.conversion 
    ? Math.min((campaign.metrics.conversion / 10) * 100, 100) 
    : 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md',
        isActive && 'border-green-200 dark:border-green-800',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 rounded-lg p-1.5', color)}>
          {Icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{campaign.title}</p>
            <Badge className={status}>{campaign.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
        </div>

        {isActive && (
          <div className="shrink-0">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </div>
        )}
      </div>

      {/* Channel & Dates */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Megaphone className="h-3 w-3" />
          {campaign.channel}
        </span>
        {campaign.startDate && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {campaign.startDate}
            </span>
          </>
        )}
        {campaign.endDate && (
          <>
            <span>→</span>
            <span>{campaign.endDate}</span>
          </>
        )}
      </div>

      {/* Metrics */}
      {campaign.metrics && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded bg-muted/30 p-1.5">
            <p className="text-xs font-medium">{campaign.metrics.reach || 0}</p>
            <p className="text-[9px] text-muted-foreground">Reach</p>
          </div>
          <div className="rounded bg-muted/30 p-1.5">
            <p className="text-xs font-medium">{campaign.metrics.engagement || 0}%</p>
            <p className="text-[9px] text-muted-foreground">Engagement</p>
          </div>
          <div className="rounded bg-muted/30 p-1.5">
            <p className="text-xs font-medium">{campaign.metrics.conversion || 0}%</p>
            <p className="text-[9px] text-muted-foreground">Conversion</p>
          </div>
          <div className="rounded bg-muted/30 p-1.5">
            <p className="text-xs font-medium">{campaign.metrics.qualified || 0}</p>
            <p className="text-[9px] text-muted-foreground">Qualified</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {isActive && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Expand */}
      {campaign.onAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide actions' : 'Show actions'}
        </button>
      )}

      {expanded && campaign.onAction && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button size="sm" className="gap-1">
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => campaign.onAction?.('edit')}>
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          {campaign.status === 'active' && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => campaign.onAction?.('pause')}>
              <Clock className="h-3 w-3" />
              Pause
            </Button>
          )}
          {campaign.status === 'planning' && (
            <Button size="sm" variant="default" className="gap-1" onClick={() => campaign.onAction?.('launch')}>
              <Rocket className="h-3 w-3" />
              Launch
            </Button>
          )}
          {campaign.status !== 'completed' && campaign.status !== 'failed' && (
            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => campaign.onAction?.('archive')}>
              <XCircle className="h-3 w-3" />
              Archive
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
