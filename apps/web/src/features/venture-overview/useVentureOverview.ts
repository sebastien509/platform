import { useMemo } from 'react';
import { useVentures } from '@/lib/hooks/useVentures';
import { useRuns } from '@/lib/hooks/useRuns';
import { useDeliverables } from '@/lib/hooks/useDeliverables';
import type { VenturePageId } from '@/lib/types';

/* The seven funnel pages, in intended order. */
export const FUNNEL_PAGES: Array<{
  key: VenturePageId;
  label: string;
  opTarget: number; // how many outputs = page complete
}> = [
  { key: 'strategy', label: 'Strategy', opTarget: 5 },
  { key: 'product', label: 'Product', opTarget: 3 },
  { key: 'engineering', label: 'Engineering', opTarget: 4 },
  { key: 'gtm', label: 'GTM', opTarget: 4 },
  { key: 'campaigns', label: 'Campaigns', opTarget: 3 },
  { key: 'sales', label: 'Sales', opTarget: 6 },
  { key: 'growth', label: 'Growth', opTarget: 2 },
];

export type PageState =
  | 'not_started'
  | 'in_progress'
  | 'needs_review'
  | 'complete';

export interface JourneyStep {
  key: VenturePageId;
  label: string;
  state: PageState;
  percent: number;
  validatedCount: number;
  opTarget: number;
}

export interface NextAction {
  severity: 'critical' | 'warning' | 'info' | 'none';
  title: string;
  why: string;
  primaryLabel: string;
  primaryTo: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  text: string;
  tone: 'positive' | 'neutral' | 'warning';
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function useVentureOverview(ventureId: string | undefined) {
  const { data: ventures, isLoading: ventureLoading } = useVentures();
  const venture = useMemo(
    () => (ventures ?? []).find((v) => v.id === ventureId),
    [ventures, ventureId]
  );

  const { runs, isLoading: runsLoading } = useRuns({
    ventureId,
    hydrate: false,
  });

  const { data: allOutputs, isLoading: outputsLoading } = useDeliverables({
    ventureId,
  });
  const outputs = allOutputs ?? [];

  /* ── Journey steps ── */
  const journey: JourneyStep[] = useMemo(() => {
    return FUNNEL_PAGES.map((p) => {
      const pageOutputs = outputs.filter(
        (d) => d.pageId === p.key && d.status === 'validated'
      );
      const validatedCount = pageOutputs.length;
      const percent =
        p.opTarget === 0
          ? 0
          : Math.min(100, Math.round((validatedCount / p.opTarget) * 100));

      let state: PageState = 'not_started';
      if (validatedCount >= p.opTarget) state = 'complete';
      else if (validatedCount > 0) state = 'in_progress';

      /* Any run on this page currently needs the founder? */
      const needsYou = runs.some(
        (r) => r.page === p.key && r.status === 'needs_you'
      );
      if (needsYou) state = 'needs_review';

      return {
        key: p.key,
        label: p.label,
        state,
        percent,
        validatedCount,
        opTarget: p.opTarget,
      };
    });
  }, [outputs, runs]);

  const completeCount = journey.filter((s) => s.state === 'complete').length;

  /* ── Narrative ── */
  const narrative = useMemo(() => {
    const name = venture?.name ?? 'This venture';
    if (outputs.length === 0 && runs.length === 0) {
      return `${name} hasn't started yet. Strategy is the foundation — everything else builds on it.`;
    }
    if (completeCount === journey.length) {
      return `${name} has a complete funnel. Analytics and Outcomes track what the venture is doing in the world.`;
    }
    const nextIncomplete = journey.find((s) => s.state !== 'complete');
    if (nextIncomplete) {
      return `${completeCount} of ${journey.length} pages complete. ${nextIncomplete.label} is the current focus — ${nextIncomplete.validatedCount} of ${nextIncomplete.opTarget} outputs landed.`;
    }
    return `${completeCount} of ${journey.length} pages complete.`;
  }, [venture?.name, completeCount, journey, outputs.length, runs.length]);

  /* ── Next best action ── */
  const nextAction: NextAction = useMemo(() => {
    const needsYou = runs.find((r) => r.status === 'needs_you');
    if (needsYou) {
      const opVerb = (needsYou as any).opVerb ?? needsYou.objective ?? 'A run';
      return {
        severity: 'critical',
        title: `${opVerb} is waiting on you`,
        why: 'The agent paused mid-run for an answer. Open the drawer to continue.',
        primaryLabel: 'Open drawer',
        primaryTo: `/ventures/${ventureId}`,
      };
    }

    if (runs.length === 0 && outputs.length === 0) {
      return {
        severity: 'info',
        title: 'Start with Strategy',
        why: 'The Strategy page defines the ICP, positioning, and brand every other page depends on.',
        primaryLabel: 'Open Strategy',
        primaryTo: `/ventures/${ventureId}/strategy`,
      };
    }

    const inProgress = journey.find(
      (s) => s.state === 'in_progress' && s.validatedCount > 0
    );
    if (inProgress) {
      return {
        severity: 'warning',
        title: `Continue ${inProgress.label}`,
        why: `${inProgress.validatedCount} of ${inProgress.opTarget} outputs landed. Finish the page to unlock the next.`,
        primaryLabel: `Open ${inProgress.label}`,
        primaryTo: `/ventures/${ventureId}/${inProgress.key}`,
      };
    }

    const notStarted = journey.find((s) => s.state === 'not_started');
    if (notStarted) {
      return {
        severity: 'info',
        title: `Open ${notStarted.label}`,
        why: 'Earlier pages are complete. This is the next page in the funnel.',
        primaryLabel: `Open ${notStarted.label}`,
        primaryTo: `/ventures/${ventureId}/${notStarted.key}`,
      };
    }

    return {
      severity: 'none',
      title: 'Nothing needs you right now',
      why: 'Every page is complete. Outcomes tracks ongoing signals.',
      primaryLabel: 'Open Outcomes',
      primaryTo: `/ventures/${ventureId}/outcomes`,
    };
  }, [runs, outputs.length, journey, ventureId]);

  /* ── Activity — chronological, runs + validated outputs ── */
  const activity: ActivityEntry[] = useMemo(() => {
    const entries: ActivityEntry[] = [];

    for (const r of runs.slice(0, 20)) {
      const verb = (r as any).opVerb ?? r.objective ?? 'Run';
      const tone: ActivityEntry['tone'] =
        r.status === 'failed'
          ? 'warning'
          : r.status === 'done' || r.status === 'review_ready'
          ? 'positive'
          : 'neutral';
      entries.push({
        id: `run_${r.id}`,
        timestamp: r.completedAt ?? r.startedAt,
        text:
          r.status === 'failed'
            ? `${verb} failed`
            : r.status === 'done' || r.status === 'review_ready'
            ? `Ran ${verb}`
            : `Started ${verb}`,
        tone,
      });
    }

    for (const d of outputs.slice(0, 20)) {
      entries.push({
        id: `out_${d.id}`,
        timestamp: d.validatedAt ?? d.createdAt,
        text: `Saved ${d.title}`,
        tone: 'positive',
      });
    }

    return entries
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8);
  }, [runs, outputs]);

  /* ── Needs you — runs paused ── */
  const needsYou = useMemo(
    () =>
      runs.filter(
        (r) => r.status === 'needs_you' || r.status === 'review_ready'
      ),
    [runs]
  );

  const isLoading = ventureLoading || runsLoading || outputsLoading;

  return {
    venture,
    journey,
    narrative,
    nextAction,
    activity,
    needsYou,
    isLoading,
    relativeTime,
    stats: {
      runs: runs.length,
      outputs: outputs.length,
      completePages: completeCount,
      totalPages: journey.length,
      healthPercent: Math.round((completeCount / journey.length) * 100),
    },
  };
}
