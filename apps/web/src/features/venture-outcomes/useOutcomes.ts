import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRuns } from '@/lib/hooks/useRuns';

export type OutcomeKind =
  | 'task'
  | 'email'
  | 'repo'
  | 'deploy'
  | 'notion'
  | 'slack'
  | 'calendar';

export interface OutcomeRow {
  id: string;
  kind: OutcomeKind;
  action: string;
  title: string;
  detail?: string | null;
  externalId: string | null;
  externalUrl: string | null;
  status: 'success' | 'error' | 'running' | 'needs_you' | 'abandoned';
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ConnectorRunRow {
  id: string;
  connector_id: string;
  op_id: string | null;
  thread_id: string | null;
  output_id: string | null;
  action: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  external_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

const ACTION_TO_KIND: Record<string, OutcomeKind> = {
  'gmail.send': 'email',
  'github.create-repo': 'repo',
  'vercel.deploy': 'deploy',
  'notion.create-page': 'notion',
  'slack.post-message': 'slack',
  'calendar.create-event': 'calendar',
};

function resolveExternalUrl(row: ConnectorRunRow): string | null {
  const r = row.response as any;
  return (
    r?.repoUrl ??
    r?.deployUrl ??
    r?.pageUrl ??
    r?.eventUrl ??
    (row.external_id && row.external_id.startsWith('http')
      ? row.external_id
      : null)
  );
}

function describeRun(row: ConnectorRunRow): string {
  const req = row.request as any;
  switch (row.action) {
    case 'gmail.send':
      return `→ ${req?.to ?? 'recipient'}`;
    case 'github.create-repo':
      return `→ ${req?.name ?? row.external_id ?? 'repo'}`;
    case 'vercel.deploy':
      return `→ ${req?.project_name ?? 'prototype'}`;
    case 'notion.create-page':
      return `→ ${req?.title ?? 'page'}`;
    case 'slack.post-message':
      return `→ ${req?.channel ?? '#general'}`;
    case 'calendar.create-event':
      return `→ ${req?.title ?? 'call'}`;
    default:
      return '';
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case 'gmail.send':
      return 'Email sent';
    case 'github.create-repo':
      return 'Repo created';
    case 'vercel.deploy':
      return 'Deployed';
    case 'notion.create-page':
      return 'Notion page';
    case 'slack.post-message':
      return 'Slack message';
    case 'calendar.create-event':
      return 'Event booked';
    default:
      return action;
  }
}

export function useOutcomes(ventureId: string | undefined) {
  const { runs, isLoading: runsLoading } = useRuns({
    ventureId,
    hydrate: false,
  });

  const runIds = useMemo(() => runs.map((r: any) => r.id), [runs]);
  const q = useQuery<ConnectorRunRow[]>({
    queryKey: ['connector-runs', ventureId ?? null, runIds.length],
    enabled: Boolean(ventureId) && runIds.length > 0,
    queryFn: async () => {
      if (runIds.length === 0) return [];
      const { data, error } = await supabase
        .from('connector_runs')
        .select('*')
        .in('thread_id', runIds)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ConnectorRunRow[];
    },
    staleTime: 15_000,
  });

  /* Tasks — the agent runs themselves */
  const taskRows: OutcomeRow[] = useMemo(() => {
    return runs.map((r) => {
      const verb = (r as any).opVerb ?? r.objective ?? 'Run';
      const blockCount = r.blocks?.length ?? 0;
      /* Compute status from closedReason first — a run that
         was abandoned isn't a failure, it's a founder decision. */
      const status: OutcomeRow['status'] =
        r.closedReason === 'abandoned'
          ? 'abandoned'
          : r.closedReason === 'failed' || r.status === 'failed'
          ? 'error'
          : r.closedReason === 'validated' ||
            r.status === 'done' ||
            r.status === 'review_ready'
          ? 'success'
          : r.status === 'needs_you'
          ? 'needs_you'
          : 'running';
      return {
        id: `task_${r.id}`,
        kind: 'task',
        action: r.opId ?? 'agent.run',
        title: verb,
        detail: `${blockCount} ${blockCount === 1 ? 'step' : 'steps'}`,
        externalId: r.id,
        externalUrl: null,
        status,
        errorMessage: null,
        createdAt: r.startedAt,
        completedAt: r.completedAt ?? null,
      };
    });
  }, [runs]);

  /* Actions — the external calls */
  const actionRows: OutcomeRow[] = useMemo(() => {
    return (q.data ?? []).map((row) => ({
      id: row.id,
      kind: ACTION_TO_KIND[row.action] ?? 'task',
      action: row.action,
      title: actionLabel(row.action),
      detail: describeRun(row),
      externalId: row.external_id,
      externalUrl: resolveExternalUrl(row),
      status: (row.status as any) ?? 'success',
      errorMessage: row.error_message,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  }, [q.data]);

  const allRows = useMemo(
    () =>
      [...taskRows, ...actionRows].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    [taskRows, actionRows]
  );

  const stats = useMemo(() => {
    const tasks = taskRows.length;
    const emails = actionRows.filter(
      (r) => r.kind === 'email' && r.status === 'success'
    ).length;
    const external = actionRows.filter(
      (r) => r.status === 'success' && r.kind !== 'email'
    ).length;
    const errors = [...taskRows, ...actionRows].filter(
      (r) => r.status === 'error'
    ).length;
    return { tasks, emails, external, errors };
  }, [taskRows, actionRows]);

  return {
    rows: allRows,
    stats,
    isLoading: runsLoading || q.isLoading,
    refetch: q.refetch,
  };
}
