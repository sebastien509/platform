import { ArrowRight, Sparkles, Package } from 'lucide-react';
import { AgentIcon } from '@/components/agents/identity';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type {
  BaseAgentListing,
  ToolListing,
  SpecializedAgentListing,
  Listing,
} from './appsRegistry';
import { FUNCTION_LABEL } from './appsRegistry';

interface AppCardProps {
  listing: Listing;
  /** Target venture for base-agent routing. */
  ventureId?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function AppCard({
  listing,
  onClick,
  disabled,
  className,
}: AppCardProps) {
  const isBase = listing.type === 'base_agent';
  const isTool = listing.type === 'tool';
  const isSpec = listing.type === 'specialized_agent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-left',
        'hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between mb-3">
        {isBase && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)]">
            <AgentIcon agent={(listing as BaseAgentListing).agentKey} size={18} />
          </span>
        )}
        {isTool && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)]">
            <Package className="h-4 w-4" />
          </span>
        )}
        {isSpec && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)]">
            <AgentIcon
              agent={(listing as SpecializedAgentListing).agentKey}
              size={18}
            />
          </span>
        )}

        {isBase && (
          <Badge className="text-2xs bg-[var(--accent-muted)] text-[var(--accent)]">
            Included with IV
          </Badge>
        )}
        {isSpec && (
          <Badge className="text-2xs bg-[var(--surface-2)] text-[var(--text-muted)] gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Specialized
          </Badge>
        )}
      </div>

      {/* Name + role */}
      <div className="flex items-center gap-2 mb-1">
        <p className="font-medium text-sm text-[var(--text-primary)]">
          {listing.name}
        </p>
      </div>

      {isBase && (
        <p className="text-2xs text-[var(--text-muted)] mb-2">
          {(listing as BaseAgentListing).role}
        </p>
      )}
      {isTool && (
        <p className="text-2xs text-[var(--text-muted)] mb-2">
          {(listing as ToolListing).category}
        </p>
      )}

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">
        {listing.description}
      </p>

      {/* Footer — where it lives */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-2xs text-[var(--text-muted)]">
          {isBase && (listing as BaseAgentListing).home !== 'research' && (
            <>Opens in {FUNCTION_LABEL[(listing as BaseAgentListing).home]}</>
          )}
          {isBase && (listing as BaseAgentListing).home === 'research' && (
            <>Opens in your active idea</>
          )}
          {isTool && (
            <>
              Available in{' '}
              {(listing as ToolListing).surfacesIn
                .map((a) => FUNCTION_LABEL[a])
                .join(' · ')}
            </>
          )}
          {isSpec && (
            <>
              Available in {FUNCTION_LABEL[(listing as SpecializedAgentListing).surfacesIn]}
            </>
          )}
        </p>
        <ArrowRight className="h-3 w-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}
