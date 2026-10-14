import { AppCard } from './AppCard';
import type { Listing } from './appsRegistry';
import { cn } from '@/lib/utils/cn';

interface AppsAgentsGridProps {
  includedAgents: Listing[];
  tools: Listing[];
  specializedAgents: Listing[];
  onSelect: (listing: Listing) => void;
  ventureId?: string;
  disabled?: boolean;
  className?: string;
}

export function AppsAgentsGrid({
  includedAgents,
  tools,
  specializedAgents,
  onSelect,
  disabled,
  className,
}: AppsAgentsGridProps) {
  const sections = [
    { key: 'included', title: 'Included with IV', items: includedAgents },
    { key: 'tools', title: 'Tools & integrations', items: tools },
    { key: 'spec', title: 'Specialized agents', items: specializedAgents },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        Nothing matches that filter.
      </p>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {sections.map((section) => (
        <div key={section.key}>
          <p className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">
            {section.title}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {section.items.map((listing) => (
              <AppCard
                key={listing.id}
                listing={listing}
                ventureId={undefined}
                onClick={() => onSelect(listing)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
