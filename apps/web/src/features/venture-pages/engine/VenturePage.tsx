import { useMemo, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell, PageHeader } from '@/components/layout';
import { VentureSourceCard } from '@/features/venture-docs/VentureSourceCard';
import { useVentureStore } from '@/lib/stores/ventureStore';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import { useThreads } from '@/lib/hooks/useThreads';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { rowToRun } from '@/lib/stores/agentDrawerPersistence';
import { useDeliverablesStore } from '@/lib/deliverables';
import { SectionRenderer } from './SectionRenderer';
import { ActivityBar } from './ActivityBar';
import { PageProvider } from './PageContext';
import { cn } from '@/lib/utils/cn';
import type { VenturePageConfig, VentureSection } from './types';

interface VenturePageProps {
  config: VenturePageConfig;
}

interface SectionGroup {
  id: string;
  label?: string;
  sections: VentureSection[];
}

function useSectionGroups(config: VenturePageConfig): SectionGroup[] {
  return useMemo(() => {
    if (config.sections && config.sections.length > 0) {
      return [{ id: 'flat', sections: config.sections }];
    }
    if (config.tabs && config.tabs.length > 0) {
      return config.tabs.map((t) => ({
        id: t.id,
        label: t.label,
        sections: t.sections,
      }));
    }
    return [];
  }, [config]);
}

/* Render order inside each group:
 *   1. dependencies (page-level banner if unmet)
 *   2. tools (ops grid)
 *   3. everything else
 *
 * `deliverables` sections are absorbed into the Sources card at
 * the bottom of the page. They are filtered out here.
 */
function reorder(groups: SectionGroup[]): SectionGroup[] {
  return groups.map((g) => {
    const deps: VentureSection[] = [];
    const tools: VentureSection[] = [];
    const rest: VentureSection[] = [];

    for (const s of g.sections) {
      if (s.type === 'dependencies') deps.push(s);
      else if (s.type === 'tools') tools.push(s);
      else if (s.type === 'deliverables') continue; // absorbed into Sources
      else rest.push(s);
    }

    return { ...g, sections: [...deps, ...tools, ...rest] };
  });
}

export function VenturePage({ config }: VenturePageProps) {
  const { ventureId } = useParams<{ ventureId: string }>();
  const openDocument = useDocumentViewer((s) => s.openDocument);

  const groups = useSectionGroups(config);
  const reordered = useMemo(() => reorder(groups), [groups]);

  const documents = useVentureStore((s) => s.documents);
  const citations = useMemo(() => {
    if (!documents) return [];
    return Object.values(documents).slice(0, 4).map((d) => ({
      id: d.id,
      docId: d.id,
      title: d.title,
      status: d.status,
    }));
  }, [documents]);

  /* All deliverables for this venture — DB + local store, merged.
     The hook handles both the persisted history and any
     session-fresh rows the DB write hasn't picked up yet. */
  const { data: allDeliverables } = useDeliverables({ ventureId });

  /* One-time hydration: push DB rows into the local store so
     existing consumers (ops cards, deliverable cards that read
     the store directly) see them. Only adds ids the store
     doesn't already have — local session state wins on overlap.

     Also sets activeVentureId on the store, so selectors which
     don't take a ventureId argument scope to THIS venture only.
     Without this, deliverables from a previously-visited venture
     would leak into this page. */
  useEffect(() => {
    if (!ventureId) return;
    useDeliverablesStore
      .getState()
      .hydrate(allDeliverables, ventureId);
  }, [ventureId, allDeliverables]);

  /* Hydrate agent runs from `threads`. On a fresh browser, the
     local store has no runs but the DB does. This reads them in
     and pushes them into the store — the drawer switcher, the
     ActivityBar, and the pending-count badge all read from the
     store, so they light up automatically. */
  const { data: threadRows } = useThreads({ ventureId });
  useEffect(() => {
    if (!ventureId || !threadRows || threadRows.length === 0) return;
    const runs = threadRows.map(rowToRun);
    useAgentDrawerStore.getState().hydrateRuns(runs, ventureId);
  }, [ventureId, threadRows]);

  /* This page's validated deliverables only — feeds the Sources
     card at the bottom of the page. */
  const pageDeliverables = useMemo(
    () =>
      allDeliverables.filter(
        (d) => d.pageId === config.id && d.status === 'validated'
      ),
    [allDeliverables, config.id]
  );

  /* Page-level blocked state — true when any hard dependency of this
   * page is unmet. Passed down so every card renders as blocked. */
  const pageBlocked = useMemo(() => {
    const deps = config.sections?.find((s: any) => s.type === 'dependencies') as
      | Extract<VentureSection, { type: 'dependencies' }>
      | undefined;
    if (!deps?.hard || deps.hard.length === 0) return false;
    return deps.hard.some((dep) => {
      const latest = allDeliverables
        .filter((d) => d.pageId === dep.pageId && d.opId === dep.opId)
        .sort((a, b) => b.version - a.version)[0];
      return !latest || latest.status !== 'validated';
    });
  }, [config.sections, allDeliverables]);

  const hasSources = config.hasSources && citations.length > 0;
  const hasDeliverables = pageDeliverables.length > 0;
  const showSources = hasSources || hasDeliverables;

  const hasLabeledGroups = reordered.some((g) => Boolean(g.label));

  return (
    <PageProvider pageId={config.id} ventureId={ventureId}>
      <PageShell>
        <PageHeader
          title={config.title}
          description={config.description}
        />

        <div className="venture-sections">
          {reordered.map((group) => (
            <Fragment key={group.id}>
              {hasLabeledGroups && group.label && (
                <div
                  className="venture-section-group"
                  data-width="full"
                  aria-label={`Section: ${group.label}`}
                >
                  <span className="venture-section-group__label">
                    {group.label}
                  </span>
                </div>
              )}

              {group.sections.map((section) => (
                <div
                  key={section.id}
                  data-width={section.layout ?? 'full'}
                  className={cn('venture-section-slot')}
                >
                  <SectionRenderer
                    section={section}
                    ventureId={ventureId}
                    pageKey={config.id}
                    pageBlocked={pageBlocked}
                  />
                </div>
              ))}
            </Fragment>
          ))}

          {showSources && (
            <div data-width="full" className="venture-section-slot">
              <VentureSourceCard
                citations={citations}
                deliverables={pageDeliverables}
                onOpen={openDocument}
              />
            </div>
          )}
        </div>

        <ActivityBar pageId={config.id} />
      </PageShell>
    </PageProvider>
  );
}
