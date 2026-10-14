import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lightbulb, Loader2 } from 'lucide-react';

import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

import { IdeasHero } from '@/features/ideas/IdeasHero';
import { IdeaBentoCard } from '@/features/ideas/IdeaBentoCard';
import { deriveListStatus, statusFromStage } from '@/features/ideas/listStatus';
import {
  makeLocalIdeaId,
  makeEmptyIdea,
} from '@/features/ideas/localIdea';
import { dbIdeaToLocal } from '@/features/ideas/dbIdeaConverter';

import { useIdeas } from '@/lib/hooks/useIdeas';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { cn } from '@/lib/utils/cn';
import type { IdeaListStatus } from '@/lib/types';

import '@/styles/features/ideas-bento.css';

type FilterKey = 'all' | 'in_progress' | 'validated' | 'killed';

const FILTER_ORDER: Array<{ value: FilterKey; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'validated', label: 'Validated' },
  { value: 'killed', label: 'Killed' },
];

function matchesFilter(status: IdeaListStatus, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'validated') return status === 'validated';
  if (filter === 'killed') return status === 'killed';
  return status !== 'validated' && status !== 'killed';
}

/**
 * Only ideas that have crossed the Synthesize → Validate boundary appear
 * on the Ideas list. Per the closed-rail model: an idea isn't real until
 * it's been thought through end-to-end. The list is a decision queue,
 * not a scratchpad.
 */
const VISIBLE_STATUSES: IdeaListStatus[] = [
  'ready_to_validate',
  'validated',
  'killed',
];

const STATUS_PRIORITY: IdeaListStatus[] = [
  'awaiting_review',
  'ready_to_validate',
  'researching',
  'refining',
  'capturing',
  'validated',
  'killed',
];

export default function IdeasPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: dbIdeas = [], isLoading } = useIdeas();
  const localIdeas = useJourneyStore((s) => s.ideas);
  const localJourneys = useJourneyStore((s) => s.journeys);

  const enriched = useMemo(() => {
    // DB ideas are the source of truth for anything that's been pushed.
    const pushedIds = new Set(dbIdeas.map((d) => d.id));

    const fromDb = dbIdeas.map((row) => ({
      idea: dbIdeaToLocal(row),
      status: statusFromStage(row.stage),
      href: `/ideas/${row.id}`,
    }));

    // Local-only ideas that have graduated from Synthesize. Ideas still
    // mid-journey stay invisible on the list — the closed rail owns them
    // until the founder has a complete structured card ready to act on.
    const fromLocal = localIdeas
      .filter((i) => !pushedIds.has(i.id))
      // Pushed-to-DB ideas have `serverId` set on their journey. The DB row
      // is the source of truth — don't double-count.
      .filter((i) => !(localJourneys[i.id] as any)?.serverId)
      .map((i) => ({
        idea: i,
        status: deriveListStatus(localJourneys[i.id]),
        href: `/ideas/${i.id}`,
      }))
      .filter((r) => VISIBLE_STATUSES.includes(r.status));

    return [...fromDb, ...fromLocal].sort((a, b) => {
      const pa = STATUS_PRIORITY.indexOf(a.status);
      const pb = STATUS_PRIORITY.indexOf(b.status);
      return pa - pb;
    });
  }, [dbIdeas, localIdeas, localJourneys]);

  const needingAction = useMemo(
    () =>
      enriched.filter(
        (r) => r.status !== 'validated' && r.status !== 'killed'
      ),
    [enriched]
  );

  const visibleList = useMemo(
    () => enriched.filter((r) => matchesFilter(r.status, filter)),
    [enriched, filter]
  );

  const handleNewIdea = () => {
    const id = makeLocalIdeaId();
    const idea = makeEmptyIdea(id);
    useJourneyStore.setState((s) => ({
      ideas: [idea, ...s.ideas],
    }));
    useJourneyStore.getState().ensureJourney(id);
    navigate(`/ideas/${id}`);
  };

  const handleOpenIdea = (ideaId: string) => {
    navigate(`/ideas/${ideaId}`);
  };

  if (isLoading) {
    return (
      <PageContainer width="full">
        <div className="ideas-page">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (enriched.length === 0) {
    return (
      <PageContainer width="full">
        <div className="ideas-page">
          <EmptyState
            title="No ideas yet"
            description="Capture your first idea — the platform takes it from there."
            icon={<Lightbulb className="h-6 w-6" />}
            action={
              <Button onClick={handleNewIdea} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Capture an idea
              </Button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="full">
      <div className="ideas-page">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Ideas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Explore possibilities. Find what deserves to become a venture.
            </p>
          </div>
          <button
            type="button"
            className="ideas-new-btn shrink-0"
            onClick={handleNewIdea}
          >
            <Plus className="h-4 w-4" />
            New idea
          </button>
        </header>

        {needingAction.length > 0 && (
          <section aria-label="What needs your attention">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                What needs your attention?
              </span>
            </div>
            <IdeasHero
              needingAction={needingAction as any}
              onOpen={handleOpenIdea}
              onCapture={handleNewIdea}
            />
          </section>
        )}

        <section aria-label="Your ideas">
          <div className="ideas-toolbar">
            <div className="ideas-toolbar__left">
              <div
                className="ideas-filters"
                role="group"
                aria-label="Filter ideas by status"
              >
                {FILTER_ORDER.map((item) => {
                  const active = filter === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        'ideas-filter-chip',
                        active && 'is-active'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ideas-toolbar__right">
              <span className="text-xs text-[var(--text-muted)]">
                {visibleList.length}{' '}
                {visibleList.length === 1 ? 'idea' : 'ideas'}
              </span>
            </div>
          </div>

          {visibleList.length > 0 ? (
            <div className="ideas-grid">
              {visibleList.map((row) => (
                <IdeaBentoCard
                  key={row.idea.id}
                  idea={row.idea}
                  journey={localJourneys[row.idea.id]}
                  status={row.status}
                  onClick={() => handleOpenIdea(row.idea.id)}
                />
              ))}
            </div>
          ) : (
            <div className="ideas-empty-inline">
              <Lightbulb className="h-6 w-6" />
              <p>No ideas match this filter.</p>
              <button
                type="button"
                className="ideas-new-btn"
                onClick={handleNewIdea}
              >
                <Plus className="h-4 w-4" />
                New idea
              </button>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
