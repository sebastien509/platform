import { supabase } from '@/lib/supabase';
import type { AgentRun, AgentBlock, VenturePageId } from '@/lib/types';

/* ------------------------------------------------------------
   agentDrawerPersistence — the sidecar for the drawer store.

   The store stays synchronous. This module is the only place
   that talks to Supabase. A subscription (installed from the
   store file) calls into these functions on state change.

   Debouncing:
     · startRun → immediate insert (so a fast-close tab still
       records the run)
     · emitBlock → debounced upsert (coalesce bursts)
     · endRun → immediate flush (final state is durable)
     · status flips to done/review_ready → immediate flush
   ------------------------------------------------------------ */

/* Local idea IDs (e.g. "local_xxx") are used during the journey
 * before the idea is pushed to the DB. The threads.idea_id column
 * is a UUID, so we only send it when it's actually a UUID. */
function isUuid(s: string | undefined | null): boolean {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

type ThreadKind =
  | 'idea_capture'
  | 'idea_clean'
  | 'idea_research'
  | 'idea_synthesize'
  | 'op_run'
  | 'agent_chat';

const FLUSH_DELAY_MS = 600;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/* ------------------------------------------------------------
   Kind inference — the store doesn't carry an explicit kind.
   Derive it from the run's origin.
   ------------------------------------------------------------ */
function inferKind(run: AgentRun): ThreadKind {
  if (run.ideaId) {
    switch (run.agentId) {
      case 'research':
        return 'idea_research';
      case 'capture':
        return 'idea_capture';
      case 'clean':
        return 'idea_clean';
      case 'synthesize':
        return 'idea_synthesize';
      default:
        return 'agent_chat';
    }
  }
  if (run.opId) return 'op_run';
  return 'agent_chat';
}

/* ------------------------------------------------------------
   run → row. Only writes columns that exist on threads.
   opIcon / opVerb are dropped — they're derivable from opId
   client-side and not worth a column.
   ------------------------------------------------------------ */
function runToRow(run: AgentRun, userId: string) {
  return {
    id: run.id,
    user_id: userId,
    kind: inferKind(run),
    agent_id: run.agentId ?? null,
    objective: run.objective ?? null,
    op_id: run.opId ?? null,
    page: run.page ?? null,
    idea_id: isUuid(run.ideaId) ? run.ideaId : null,
    venture_id: run.ventureId ?? null,
    conversation_mode: run.conversationMode ?? false,
    status: run.status,
    blocks: run.blocks,
    started_at: run.startedAt,
    completed_at: run.completedAt ?? null,
    closed_at: run.closedAt ?? null,
    closed_reason: run.closedReason ?? null,
  };
}

interface ThreadRow {
  id: string;
  user_id: string;
  kind: string;
  agent_id: string | null;
  objective: string | null;
  op_id: string | null;
  page: string | null;
  idea_id: string | null;
  venture_id: string | null;
  conversation_mode: boolean;
  status: string;
  blocks: AgentBlock[];
  started_at: string;
  completed_at: string | null;
  closed_at: string | null;
  closed_reason: string | null;
}

export function rowToRun(row: ThreadRow): AgentRun {
  return {
    id: row.id,
    agentId: row.agent_id ?? 'unknown',
    ventureId: row.venture_id ?? undefined,
    ideaId: row.idea_id ?? undefined,
    conversationMode: row.conversation_mode,
    page: (row.page ?? undefined) as VenturePageId | undefined,
    status: row.status as AgentRun['status'],
    objective: row.objective ?? '',
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closedReason: (row.closed_reason as any) ?? undefined,
    opId: row.op_id ?? undefined,
  };
}

/* ------------------------------------------------------------
   flushRun — upsert the run into threads.
   Upsert instead of insert+update so a failed start-run write
   is repaired on the next flush.
   ------------------------------------------------------------ */
export async function flushRun(run: AgentRun): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const row = runToRow(run, auth.user.id);
  const { error } = await supabase
    .from('threads')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    // Non-fatal — the local store remains authoritative.
    console.warn('[threads] persist failed', error.message);
  }
}

/* ------------------------------------------------------------
   scheduleFlush — debounced.
   ------------------------------------------------------------ */
export function scheduleFlush(run: AgentRun): void {
  const existing = timers.get(run.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    timers.delete(run.id);
    void flushRun(run);
  }, FLUSH_DELAY_MS);

  timers.set(run.id, timer);
}

/* ------------------------------------------------------------
   flushNow — cancel any pending timer and write immediately.
   ------------------------------------------------------------ */
export function flushNow(run: AgentRun): void {
  const existing = timers.get(run.id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(run.id);
  }
  void flushRun(run);
}

/* ------------------------------------------------------------
   loadRun — hydrate a single thread from the DB.
   ------------------------------------------------------------ */
export async function loadRun(id: string): Promise<AgentRun | null> {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRun(data as ThreadRow);
}

/* ------------------------------------------------------------
   listRecentRuns — optional helper for surfaces that read
   multiple threads (activity views, history panels).
   ------------------------------------------------------------ */
export async function listRecentRuns(opts: {
  ventureId?: string;
  ideaId?: string;
  limit?: number;
} = {}): Promise<AgentRun[]> {
  let q = supabase
    .from('threads')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.ventureId) q = q.eq('venture_id', opts.ventureId);
  else if (opts.ideaId) q = q.eq('idea_id', opts.ideaId);

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((r) => rowToRun(r as ThreadRow));
}
