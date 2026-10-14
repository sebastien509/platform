import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useJourneyStore } from '@/lib/stores/journeyStore';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useCurrentWorkspace } from '@/lib/hooks/useWorkspace';
import { runTargetedResearch } from './runTargetedResearch';
import type { IdeaJourney, ResearchThreadKind } from '@/lib/types';

const STORAGE_KEY = 'iv:research-more:usage';

interface DailyUsage { date: string; count: number }
function todayKey(): string { return new Date().toISOString().slice(0, 10); }
function readUsage(): DailyUsage {
  if (typeof localStorage === 'undefined') return { date: todayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const p = JSON.parse(raw) as DailyUsage;
    if (p.date !== todayKey()) return { date: todayKey(), count: 0 };
    return p;
  } catch { return { date: todayKey(), count: 0 }; }
}
function bumpUsage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const c = readUsage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(), count: c.count + 1 }),
    );
  } catch { /* storage disabled */ }
}

function rid(prefix = 'blk') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const KIND_LABEL: Record<ResearchThreadKind, string> = {
  market: 'Market research',
  competitor: 'Competitive landscape',
  customer: 'Customer insight',
};

/**
 * useResearchRun — fires a targeted research thread from the
 * Validate page ("Ask for more").
 *
 * Opens a standard side drawer run, streams the memo as an output
 * block, persists to knowledge_entries, and merges into the local
 * journey. Starter tier is capped at STARTER_DAILY_LIMIT runs/day.
 */
export function useResearchRun(
  ideaId: string,
  onChange: (next: IdeaJourney) => void,
) {
  const journey = useJourneyStore((s) => s.journeys[ideaId]);
  const setJourney = useJourneyStore((s) => s.setJourney);
  const qc = useQueryClient();
  const workspace = useCurrentWorkspace();

  return useCallback(
    async (input: {
      kind: ResearchThreadKind;
      query: string;
      tier?: string;
    }) => {
      if (!journey) {
        console.warn('[research-more] no journey');
        return;
      }

      /* Research is free and unlimited. It's the hook — the entire
       * idea-shaping pipeline runs at zero cost on Free. The tier
       * gate is at the venture step, not here. */

      const tier = input.tier ?? 'free';
      if (tier === 'free') {
        /* Cap only against abuse — a soft limit that resets daily.
         * 10 runs a day is more than any real founder hits, but
         * blocks a bot. */
        const usage = readUsage();
        if (usage.count >= 50) {
          window.alert(
            'Daily research limit reached. Try again tomorrow.',
          );
          return;
        }
      }

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const workspaceId = workspace.data?.id;
      if (!workspaceId) {
        console.warn('[research-more] no workspace');
        return;
      }

      /* ── 1. Open the drawer with a run ── */
      const store = useAgentDrawerStore.getState();
      const runId = store.startRun({
        agentId: 'research',
        objective: `Targeted research: ${KIND_LABEL[input.kind]}`,
        ideaId,
        conversationMode: false,
        page: 'knowledge' as any,
      } as any);

      store.updateRun(runId, {
        opId: 'knowledge.research',
        opIcon: 'search',
        opVerb: 'Targeted research',
      } as any);

      store.emitBlock({
        id: rid(),
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'step',
        label: `Focusing on: ${input.query}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      store.emitBlock({
        id: rid(),
        runId,
        agentId: 'research',
        createdAt: new Date().toISOString(),
        type: 'status',
        state: 'working',
        objective: `Running ${KIND_LABEL[input.kind]}…`,
      });

      store.setActiveRun(runId);
      store.openDrawer(runId);

      bumpUsage();

      /* ── 2. Fire the real generator ── */
      try {
        const entry = await runTargetedResearch({
          ideaId,
          workspaceId,
          userId: auth.user.id,
          kind: input.kind,
          query: input.query,
          rawCapture: journey.rawCapture ?? '',
          structured: journey.structured,
          priorEntries: journey.researchEntries ?? [],
        });

        /* ── 3. Show the output in the drawer ── */
        store.emitBlock({
          id: rid(),
          runId,
          agentId: 'research',
          createdAt: new Date().toISOString(),
          type: 'output',
          kind: 'document',
          title: entry.title,
          destination: `Research › ${KIND_LABEL[input.kind]}`,
          status: 'approved',
          previewHref: `research:${entry.id}`,
          payload: { researchEntry: entry },
        } as any);

        store.endRun(runId, 'done' as any);

        /* ── 4. Merge into the local journey ── */
        const current =
          useJourneyStore.getState().journeys[ideaId] ?? journey;
        const byId = new Map<string, any>();
        for (const e of current.researchEntries ?? []) byId.set(e.id, e);
        byId.set(entry.id, entry);

        const next: IdeaJourney = {
          ...current,
          researchEntries: Array.from(byId.values()),
          updatedAt: new Date().toISOString(),
        };
        setJourney(ideaId, next);
        onChange(next);

        /* ── 5. Refetch DB ── */
        await qc.invalidateQueries({
          queryKey: ['idea-knowledge', ideaId],
        });
      } catch (e) {
        console.error('[research-more] failed', e);

        store.emitBlock({
          id: rid(),
          runId,
          agentId: 'research',
          createdAt: new Date().toISOString(),
          type: 'error',
          message:
            e instanceof Error ? e.message : 'Targeted research failed',
          actions: ['retry', 'ignore'],
        });
        store.endRun(runId, 'failed' as any);
      }
    },
    [ideaId, journey, setJourney, onChange, qc, workspace.data?.id],
  );
}
