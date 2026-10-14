import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIdeas } from '@/lib/hooks/useIdeas';
import { useAgents } from '@/lib/hooks/useAgents';
import { useCheckpoints, useResolveCheckpoint } from '@/lib/hooks/useCheckpoints';
import { useOutcomes } from '@/lib/hooks/useOutcomes';
import { usePulse } from '@/lib/hooks/usePulse';
import { unwrapList } from '@/lib/utils/unwrap';

export interface TodayDecision {
  id: string;
  title: string;
  description: string;
  type: 'approval' | 'review' | 'choice' | 'investigation';
  priority: 'high' | 'medium' | 'low';
  source: string;
  sourceType: 'agent' | 'system' | 'founder';
  createdAt: string;
  options?: Array<{ label: string; value: string; primary?: boolean; destructive?: boolean }>;
}
export interface TodayInProgress { id: string; title: string; description: string; type: 'agent' | 'workflow' | 'build' | 'campaign'; status: 'running' | 'waiting' | 'completed' | 'blocked'; progress?: number; source: string; }
export interface TodayWin { id: string; title: string; description: string; value?: string; type: 'metric' | 'milestone' | 'customer' | 'revenue' | 'product'; source: string; createdAt: string; }
export interface TodayAttention { id: string; title: string; description: string; severity: 'critical' | 'warning' | 'info'; source: string; createdAt: string; action?: { label: string; onClick: () => void }; }
export interface TodayUpdate { id: string; title: string; description: string; kind: 'idea' | 'outcome' | 'learning' | 'activity'; label: string; href?: string; timestamp: number; }

function timeValue(input: unknown): number {
  if (!input) return 0;
  const n = new Date(String(input)).getTime();
  return Number.isFinite(n) ? n : 0;
}
function displayDate(input: unknown): string {
  const n = timeValue(input);
  return n ? new Date(n).toLocaleDateString() : 'Recently';
}

/** Founder-wide view: no venture ID required. All content comes from existing API hooks. */
export function useToday() {
  const queryClient = useQueryClient();
  const ideas = useIdeas();
  const agents = useAgents();
  const checkpoints = useCheckpoints();
  const outcomes = useOutcomes();
  const pulse = usePulse();
  const resolveCheckpoint = useResolveCheckpoint();

  const isLoading = ideas.isLoading || agents.isLoading || checkpoints.isLoading || outcomes.isLoading || pulse.isLoading;
  const error = ideas.error ?? agents.error ?? checkpoints.error ?? outcomes.error ?? pulse.error;

  const data = useMemo(() => {
    const checkpointList = unwrapList(checkpoints.data);
    const agentList = unwrapList(agents.data);
    const pulseList = unwrapList(pulse.data);
    const outcomeList = unwrapList(outcomes.data);
    const ideaList = unwrapList(ideas.data);
    const pendingCheckpoints = checkpointList.filter((c: any) => c.status === 'pending');
    const workingAgents = agentList.filter((a: any) => a.status === 'working');

    const decisions: TodayDecision[] = [
      ...pendingCheckpoints.map((c: any) => ({
        id: String(c.id), title: c.title || 'Decision needed', description: c.description || 'Review and decide',
        type: 'choice' as const, priority: 'high' as const, source: 'Checkpoint', sourceType: 'system' as const,
        createdAt: displayDate(c.createdAt), options: c.options?.map((o: any) => ({ label: o.label, value: o.value, primary: o.action === 'approve', destructive: o.action === 'reject' })),
      })),
      // Pulse decisions remain listed for visibility. Existing useResolveCheckpoint only supports checkpoints.
      ...pulseList.filter((p: any) => p.type === 'decision').map((p: any) => ({
        id: String(p.id), title: p.title || 'Review requested', description: p.description || '',
        type: 'review' as const, priority: 'medium' as const, source: p.source || 'System', sourceType: 'system' as const,
        createdAt: displayDate(p.timestamp), options: [],
      })),
    ];

    const inProgress: TodayInProgress[] = workingAgents.map((a: any) => ({
      id: String(a.id), title: a.currentTask || `${a.name} is working`, description: a.name,
      type: 'agent' as const, status: 'running' as const, source: a.name,
    }));

    const wins: TodayWin[] = [
      ...pulseList.filter((p: any) => p.type === 'success').map((p: any) => ({
        id: String(p.id), title: p.title || 'Progress recorded', description: p.description || '',
        type: 'metric' as const, source: p.source || 'System', createdAt: displayDate(p.timestamp),
      })),
      ...outcomeList.slice(0, 2).map((o: any) => ({
        id: String(o.id), title: o.title || 'Outcome recorded', description: o.summary || o.description || '',
        type: 'milestone' as const, source: 'Outcome', createdAt: displayDate(o.decisionMadeAt || o.createdAt),
        value: typeof o.metrics?.find((m: any) => m.unit === '$' && typeof m.value === 'number')?.value === 'number'
          ? `$${o.metrics.find((m: any) => m.unit === '$').value}` : undefined,
      })),
    ];

    const attention: TodayAttention[] = pulseList.filter((p: any) => p.type === 'warning').map((p: any) => ({
      id: String(p.id), title: p.title || 'Attention requested', description: p.description || '',
      severity: 'warning' as const, source: p.source || 'System', createdAt: displayDate(p.timestamp),
      // No fabricated action callback: omit until a real route or callback is provided.
    }));

    // Real update feed: sourced from existing idea, outcome, and pulse records. No invented articles.
    const updates: TodayUpdate[] = [
      ...ideaList.map((i: any) => ({
        id: `idea:${i.id}`, title: i.title || 'Idea updated',
        description: i.description || i.problem || '', kind: 'idea' as const, label: 'Idea',
        href: i.id ? `/ideas/${i.id}` : '/ideas', timestamp: timeValue(i.updatedAt || i.updated_at || i.createdAt || i.created_at),
      })),
      ...outcomeList.map((o: any) => ({
        id: `outcome:${o.id}`, title: o.title || 'Outcome recorded',
        description: o.summary || o.description || '', kind: 'outcome' as const, label: 'Outcome',
        href: o.ventureId || o.venture_id ? `/ventures/${o.ventureId || o.venture_id}/outcomes` : '/resources',
        timestamp: timeValue(o.decisionMadeAt || o.createdAt || o.created_at),
      })),
      ...pulseList.filter((p: any) => ['learning', 'insight', 'research', 'success', 'info'].includes(p.type)).map((p: any) => ({
        id: `pulse:${p.id}`, title: p.title || 'Workspace update', description: p.description || '',
        kind: (['learning', 'insight', 'research'].includes(p.type) ? 'learning' : 'activity') as 'learning' | 'activity',
        label: ['learning', 'insight', 'research'].includes(p.type) ? 'Learning' : 'Activity',
        href: typeof p.href === 'string' && p.href.startsWith('/') ? p.href : undefined,
        timestamp: timeValue(p.timestamp),
      })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    const summary = {
      activeIdeas: ideaList.filter((i: any) => !['shipped', 'killed', 'paused'].includes(i.status)).length,
      activeAgents: workingAgents.length,
      pendingCheckpoints: pendingCheckpoints.length,
      recentOutcomes: outcomeList.length,
      totalRevenue: outcomeList.reduce((sum: number, o: any) => {
        const metric = o.metrics?.find((m: any) => m.unit === '$' && typeof m.value === 'number');
        return sum + (metric?.value ?? 0);
      }, 0),
    };
    return { decisions, inProgress, wins, attention, summary, updates };
  }, [checkpoints.data, agents.data, pulse.data, outcomes.data, ideas.data]);

  const resolveDecision = useCallback((id: string, value: string) => {
    // Guard: only checkpoint IDs may be passed to useResolveCheckpoint.
    const matches = unwrapList(checkpoints.data).some((c: any) => String(c.id) === String(id) && c.status === 'pending');
    if (!matches) return;
    resolveCheckpoint.mutate({ id, choice: value }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checkpoints'] });
        queryClient.invalidateQueries({ queryKey: ['pulse'] });
      },
    });
  }, [resolveCheckpoint, queryClient, checkpoints.data]);

  return { data, isLoading, error, resolveDecision, refetch: () => { ideas.refetch(); agents.refetch(); checkpoints.refetch(); outcomes.refetch(); pulse.refetch(); } };
}
