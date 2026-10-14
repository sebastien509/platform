import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { LibraryRow } from '@/features/knowledge/LibraryRow';
import { LibraryEntryMenu } from '@/features/knowledge/LibraryEntryMenu';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { cn } from '@/lib/utils/cn';
import { Library as LibraryIcon } from 'lucide-react';
import type { KnowledgeEntryType, KnowledgeOrigin } from '@/lib/types';

type TypeFilter = KnowledgeEntryType | 'all';
type OriginFilter = KnowledgeOrigin | 'all';

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'research_report', label: 'Reports' },
  { value: 'market_analysis', label: 'Market' },
  { value: 'competitive_analysis', label: 'Competitor' },
  { value: 'interview_transcript', label: 'Interviews' },
  { value: 'customer_insight', label: 'Insights' },
  { value: 'founder_selection', label: 'Selections' },
  { value: 'synthesized_answer', label: 'Synthesis' },
  { value: 'research_note', label: 'Notes' },
];

const ORIGIN_FILTERS: Array<{ value: OriginFilter; label: string }> = [
  { value: 'all', label: 'Any origin' },
  { value: 'idea_research', label: 'Idea research' },
  { value: 'idea_founder', label: 'Idea selections' },
  { value: 'venture_agent', label: 'Venture agent' },
  { value: 'venture_founder', label: 'Venture notes' },
  { value: 'inquiry', label: 'Inquiry outputs' },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const {
    data: knowledgeData,
    isLoading,
    error,
    refetch,
  } = useKnowledge({
    types: typeFilter === 'all' ? undefined : [typeFilter],
    origins: originFilter === 'all' ? undefined : [originFilter],
  });

  const allEntries = useMemo(
    () => knowledgeData?.data ?? [],
    [knowledgeData]
  );

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton count={5} className="h-16" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Library</h1>
        <p className="marketplace-hero__lede">
          Every piece of knowledge your ventures and ideas have produced —
          reports, interviews, market analyses, and founder notes.
        </p>
      </header>

      {/* Filters */}
      <div className="plugin-tool-strip">
        <div className="plugin-tool-strip__filters">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'plugin-tool-strip__pill',
                typeFilter === f.value && 'is-active'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="plugin-tool-strip__filters">
          {ORIGIN_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setOriginFilter(f.value)}
              className={cn(
                'plugin-tool-strip__pill',
                originFilter === f.value && 'is-active'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content list */}
      {allEntries.length > 0 ? (
        <div className="library-list">
          {allEntries.map((entry) => (
            <div key={entry.id} className="library-row">
              <LibraryRow
                entry={entry}
                onOpen={() => navigate(`/library/${entry.id}`)}
                onOpenMenu={() =>
                  setOpenMenuId(openMenuId === entry.id ? null : entry.id)
                }
                menuOpen={openMenuId === entry.id}
              />
              {openMenuId === entry.id && (
                <LibraryEntryMenu
                  entry={entry}
                  onClose={() => setOpenMenuId(null)}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No entries match those filters"
          description="Try a broader filter — or run a research op in a venture or idea."
          icon={<LibraryIcon className="h-6 w-6" />}
        />
      )}
    </PageContainer>
  );
}
