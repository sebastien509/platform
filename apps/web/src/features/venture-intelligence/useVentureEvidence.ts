import { useMemo } from 'react';
import { useRuns } from '@/lib/hooks/useRuns';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import { getActionDef } from '@/features/venture-actions/page-actions';

/**
 * Page-relevance map — which surfaces feed which page.
 * Strategy page reads strategy.* surfaces. Etc.
 *
 * The 'overview' page reads everything (it's the summary).
 * 'knowledge' reads all research-type surfaces.
 */
const PAGE_SURFACES: Record<string, string[]> = {
  overview:    ['*'],
  strategy:    ['strategy.brief', 'strategy.deck'],
  product:     ['product.docs', 'product.landing'],
  engineering: ['engineering.docs', 'engineering.code', 'engineering.ui-spec'],
  gtm:         ['gtm.plan'],
  campaigns:   ['campaigns.docs', 'campaigns.email'],
  sales:       ['sales.docs', 'sales.proposal'],
  growth:      ['growth.plan'],
  funding:     ['funding.docs', 'funding.deck', 'funding.sheet'],
  knowledge:   ['*'],
  analytics:   ['*'],
  outcomes:    ['*'],
  connectors:  ['*'],
};

/** Page relevance for the fallback message. */
const PAGE_FOCUS: Record<string, string> = {
  overview:    'venture health and highest-priority next step',
  strategy:    'ICP, positioning, wedge, and market research',
  product:     'requirements, user needs, and feature scope',
  engineering: 'technical readiness, open tasks, and dependencies',
  gtm:         'target customers, channels, and acquisition experiments',
  campaigns:   'campaign performance, audience response, and creative iteration',
  sales:       'pipeline evidence, objections, and conversion blockers',
  growth:      'activation, retention, and experiment outcomes',
  funding:     'investor narrative, financial model, and diligence',
  knowledge:   'recent files, duplicate research, and evidence gaps',
  analytics:   'outcome trends, KPI movement, and confidence',
  outcomes:    'pending decisions, evidence quality, and follow-up',
  connectors:  'missing integrations that block operations',
};

export interface EvidenceDeliverable {
  id: string;
  opId: string;
  title: string;
  surfaceId?: string;
  renderType?: string;
  createdAt: string;
  validatedAt?: string | null;
  version: number;
}

export interface EvidenceRun {
  id: string;
  opId: string;
  page: string;
  status: string;
  objective?: string;
  createdAt: string;
}

export interface EvidenceGap {
  kind: 'missing_op' | 'stale' | 'pending_review' | 'blocked';
  opId?: string;
  label: string;
  hint: string;
}

export interface VentureEvidence {
  pageId: string;
  focus: string;
  ventureName: string | null;
  /** Validated deliverables on this page (or all, for overview). */
  relevantDeliverables: EvidenceDeliverable[];
  /** Recent runs on this page, terminal or active. */
  recentRuns: EvidenceRun[];
  /** Runs that need founder input. */
  needsYou: EvidenceRun[];
  /** Gaps — missing prerequisites, stale evidence, etc. */
  gaps: EvidenceGap[];
  /** Total validated deliverables across the venture. */
  totalValidated: number;
  /** Human summary line for the panel. */
  summary: string;
}

function getPageId(pathname: string): string {
  return (
    pathname.split('/').filter(Boolean)[2]?.toLowerCase() ||
    'overview'
  );
}

function isSurfaceRelevant(surfaceId: string | undefined, pageId: string): boolean {
  if (!surfaceId) return false;
  const allowed = PAGE_SURFACES[pageId] ?? [];
  if (allowed.includes('*')) return true;
  return allowed.includes(surfaceId);
}

export function useVentureEvidence(
  ventureId: string | undefined,
  pathname: string,
): VentureEvidence {
  const pageId = useMemo(() => getPageId(pathname), [pathname]);
  const focus = PAGE_FOCUS[pageId] ?? 'venture context';

  const { data: allDeliverables } = useDeliverables({ ventureId });
  const { runs } = useRuns({ ventureId, hydrate: false });

  return useMemo<VentureEvidence>(() => {
    const deliverables = (allDeliverables ?? []) as any[];
    const allRuns = (runs ?? []) as any[];

    /* Filter deliverables to this page's relevant surfaces. */
    const relevantDeliverables: EvidenceDeliverable[] = deliverables
      .filter((d) => {
        if (d.status !== 'validated') return false;
        if (pageId === 'overview') return true;
        const def = getActionDef(d.opId);
        const surfaceId = def?.surfaceId ?? d.surfaceId;
        return isSurfaceRelevant(surfaceId, pageId);
      })
      .sort(
        (a, b) =>
          new Date(b.validatedAt ?? b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.validatedAt ?? a.updatedAt ?? a.createdAt).getTime(),
      )
      .slice(0, 8)
      .map((d) => {
        const def = getActionDef(d.opId);
        return {
          id: d.id,
          opId: d.opId,
          title: d.title ?? def?.produces ?? d.opId,
          surfaceId: def?.surfaceId,
          renderType: d.renderType ?? def?.renderType,
          createdAt: d.createdAt,
          validatedAt: d.validatedAt ?? null,
          version: d.version ?? 1,
        };
      });

    /* Recent runs on this page + the needs-you ones. */
    const pageRuns: EvidenceRun[] = allRuns
      .filter((r) => pageId === 'overview' || r.page === pageId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        opId: r.opId ?? '',
        page: r.page ?? '',
        status: r.status,
        objective: r.objective,
        createdAt: r.createdAt,
      }));

    const needsYou = pageRuns.filter((r) => r.status === 'needs_you');

    /* Compute gaps — what's missing on this page. */
    const gaps: EvidenceGap[] = [];

    // Any run needs founder?
    for (const r of needsYou) {
      const def = r.opId ? getActionDef(r.opId) : undefined;
      gaps.push({
        kind: 'pending_review',
        opId: r.opId,
        label: `${def?.verb ?? r.opId} is waiting on you`,
        hint: 'Finish this run to keep the page moving.',
      });
    }

    // Any dependency not yet validated?
    // We look at ACTION defs on this page and check their requiresOps.
    const { getActionsForPage } = require('@/features/venture-actions/page-actions');
    const pageActions = getActionsForPage(pageId) ?? [];
    const validatedOpIds = new Set(
      deliverables
        .filter((d) => d.status === 'validated')
        .map((d) => d.opId as string),
    );

    for (const def of pageActions) {
      const requires = def.requiresOps ?? [];
      for (const dep of requires) {
        if (!validatedOpIds.has(dep)) {
          const depDef = getActionDef(dep);
          gaps.push({
            kind: 'missing_op',
            opId: dep,
            label: `${depDef?.verb ?? dep} hasn't run`,
            hint: `${def.verb} needs it as a prerequisite.`,
          });
        }
      }
    }

    // Any relevant op with zero validated deliverable on this page?
    const coveredOpIds = new Set(relevantDeliverables.map((d) => d.opId));
    for (const def of pageActions) {
      if (def.tier === 'secondary') continue;
      if (def.expectedOutputKind === 'action') continue;
      if (!coveredOpIds.has(def.id) && !def.requiresOps?.length) {
        gaps.push({
          kind: 'missing_op',
          opId: def.id,
          label: `${def.produces ?? def.verb} not yet produced`,
          hint: def.description ?? 'Run this op to add the missing piece.',
        });
      }
    }

    // Dedup gaps by opId
    const seen = new Set<string>();
    const dedupedGaps = gaps.filter((g) => {
      const key = `${g.kind}:${g.opId ?? g.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const totalValidated = deliverables.filter(
      (d) => d.status === 'validated',
    ).length;

    /* Summary sentence. */
    let summary = '';
    if (relevantDeliverables.length === 0 && pageRuns.length === 0) {
      summary = `Nothing on ${pageId} yet.`;
    } else if (needsYou.length > 0) {
      summary = `${needsYou.length} ${
        needsYou.length === 1 ? 'run' : 'runs'
      } need your input before ${pageId} can move.`;
    } else if (dedupedGaps.length > 0) {
      summary = `${relevantDeliverables.length} validated · ${dedupedGaps.length} gap${
        dedupedGaps.length === 1 ? '' : 's'
      } to close.`;
    } else if (relevantDeliverables.length > 0) {
      summary = `${relevantDeliverables.length} validated deliverable${
        relevantDeliverables.length === 1 ? '' : 's'
      } on this page.`;
    } else {
      summary = `${pageRuns.length} recent run${
        pageRuns.length === 1 ? '' : 's'
      } on this page.`;
    }

    return {
      pageId,
      focus,
      ventureName: null,
      relevantDeliverables,
      recentRuns: pageRuns,
      needsYou,
      gaps: dedupedGaps.slice(0, 5),
      totalValidated,
      summary,
    };
  }, [allDeliverables, runs, pageId, focus]);
}
