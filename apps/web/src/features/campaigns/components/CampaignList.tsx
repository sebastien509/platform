import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { CampaignCard } from './CampaignCard';
import { Button } from '@/components/ui/button';
import { Plus, Search, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'failed';
  type: 'email' | 'social' | 'content' | 'paid' | 'outbound' | 'experiment';
  channel: string;
  startDate?: string;
  endDate?: string;
  metrics?: {
    reach: number;
    engagement: number;
    conversion: number;
    qualified: number;
    cost?: number;
  };
  createdAt: string;
  updatedAt: string;
  onAction?: (action: string) => void;
}

interface CampaignListProps {
  campaigns: Campaign[];
  className?: string;
  onCampaignClick?: (campaign: Campaign) => void;
  onNewCampaign?: () => void;
  emptyMessage?: string;
}

const statusFilters = ['all', 'active', 'planning', 'paused', 'completed', 'failed'] as const;
type StatusFilter = typeof statusFilters[number];

export function CampaignList({
  campaigns,
  className,
  onCampaignClick,
  onNewCampaign,
  emptyMessage = 'No campaigns yet.'
}: CampaignListProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase()) ||
      campaign.channel.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (campaigns.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-8 text-center', className)}>
        <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first campaign to start reaching customers.</p>
        {onNewCampaign && (
          <Button className="mt-3 gap-2" onClick={onNewCampaign}>
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                filter === s
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {s}
              {s !== 'all' && counts[s] !== undefined && (
                <span className="ml-1 text-muted-foreground">({counts[s]})</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button size="sm" className="ml-auto gap-1" onClick={onNewCampaign}>
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => onCampaignClick?.(campaign)}
          />
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <p>No campaigns match your filters.</p>
        </div>
      )}
    </div>
  );
}
