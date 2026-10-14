import { supabase } from '@/lib/supabase';
import type { Deliverable } from './types';
import type { ShareSnapshot, SurfaceId } from '@/lib/share';
import type { RenderType, OpTier } from '@/features/venture-actions/page-actions';

/* Guard against non-UUID placeholders slipping through to Postgres.
   If a caller passes 'ven_001' or '', drop the value so the FK
   doesn't reject the whole row. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeUuid(value: string | undefined | null): string | null {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
}

/* ============================================================
   deliverables/persistence — the sidecar for the store.

   Every Deliverable maps to one `outputs` row + one row in
   `output_payloads` (the snapshot). The store stays synchronous
   and authoritative; this module is the only thing that talks
   to Postgres.

   Writes:
     · flushDeliverable  — insert/upsert outputs + payload
     · flushSupersede    — flip a row to superseded
     · flushDelete       — remove the row (payload cascades)

   ── The FK guarantee ──
   `outputs.superseded_by` is a self-referencing FK. The successor
   must exist in the DB before any row points at it. All flushes
   therefore share a single Promise chain (`flushChain`) so their
   network calls execute strictly in submission order:

     1. insert v2 (flushDeliverable)
     2. update v1.superseded_by = v2.id (flushSupersede)

   Without the chain, both fire in the same tick and the network
   latency of each `auth.getUser()` decides which lands first.
   Supersede frequently won → FK 23503.

   Belt and suspenders: `doFlushSupersede` retries once on 23503
   in case a caller somewhere bypasses the chain.
   ============================================================ */

/* ---------- Flush queue ---------- */

let flushChain: Promise<unknown> = Promise.resolve();

/**
 * enqueue — append a DB operation to the shared flush chain.
 * Returns the promise for the operation itself (so callers can
 * await or fire-and-forget). Prior failures never break the
 * chain — the next operation still runs.
 */
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = flushChain.then(fn, fn);
  flushChain = next.catch(() => {});
  return next;
}

/* ---------- Row shapes ---------- */

interface OutputRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  venture_id: string | null;
  thread_id: string | null;
  produced_by: string;
  render_type: string;
  tier: string;
  title: string;
  destination: string | null;
  status: string;
  content_kind: string;
  content_ref: string | null;
  version: number;
  superseded_by: string | null;
  page_id: string | null;
  kind: string | null;
  surface_id: string | null;
  share_link_id: string | null;
  agent_id: string | null;
  validated_at: string | null;
  superseded_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ---------- Content strategy ---------- */

function inferContentKind(d: Deliverable): 'db' | 'storage' | 'external' {
  if (d.renderType === 'repo') return 'external';
  return 'db';
}

function inferContentRef(d: Deliverable): string | null {
  if (d.renderType === 'repo') {
    const url = (d.snapshot as any)?.externalUrl;
    return typeof url === 'string' ? url : null;
  }
  return null;
}

/* ---------- Mapping ---------- */

function deliverableToRow(d: Deliverable, userId: string): Partial<OutputRow> {
  return {
    id: d.id,
    user_id: userId,
    venture_id: safeUuid(d.ventureId),
    thread_id: d.runId ?? null,
    produced_by: d.opId,
    render_type: d.renderType ?? 'markdown',
    tier: d.tier ?? 'primary',
    title: d.title,
    status: d.status,
    content_kind: inferContentKind(d),
    content_ref: inferContentRef(d),
    version: d.version,
    superseded_by: safeUuid(d.supersededBy),
    page_id: d.pageId,
    kind: d.kind,
    surface_id: d.surfaceId,
    share_link_id: d.shareLinkId ?? null,
    agent_id: d.agentId ?? null,
    validated_at: d.validatedAt ?? null,
    superseded_at: d.supersededAt ?? null,
  };
}

function rowToDeliverable(
  row: OutputRow,
  snapshot: ShareSnapshot | null
): Deliverable {
  const safeSnapshot: ShareSnapshot =
    snapshot ?? { title: row.title, sections: [] };

  return {
    id: row.id,
    opId: row.produced_by,
    renderType: row.render_type as RenderType,
    tier: row.tier as OpTier,
    pageId: row.page_id ?? '',
    ventureId: row.venture_id ?? '',
    version: row.version,
    status: row.status as Deliverable['status'],
    title: row.title,
    kind: (row.kind ?? 'document') as Deliverable['kind'],
    surfaceId: (row.surface_id ?? 'strategy.brief') as SurfaceId,
    snapshot: safeSnapshot,
    shareLinkId: row.share_link_id ?? undefined,
    runId: row.thread_id ?? undefined,
    agentId: row.agent_id ?? undefined,
    createdAt: row.created_at,
    validatedAt: row.validated_at ?? undefined,
    supersededAt: row.superseded_at ?? undefined,
    supersededBy: row.superseded_by ?? undefined,
  };
}

/* ---------- Internal workers ---------- */

async function doFlushDeliverable(d: Deliverable): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const row = deliverableToRow(d, auth.user.id);

    const { error: oErr } = await supabase
      .from('outputs')
      .upsert(row, { onConflict: 'id' });

    if (oErr) {
      console.warn('[deliverables] outputs upsert failed', oErr.message);
      return;
    }

    if (row.content_kind === 'db') {
      const { error: pErr } = await supabase
        .from('output_payloads')
        .upsert(
          { output_id: d.id, snapshot: d.snapshot },
          { onConflict: 'output_id' }
        );
      if (pErr) {
        console.warn('[deliverables] payload upsert failed', pErr.message);
      }
    }
  } catch (e) {
    console.warn('[deliverables] flush threw', e);
  }
}

async function doFlushSupersede(
  id: string,
  supersededBy: string | undefined
): Promise<void> {
  const successor = safeUuid(supersededBy);

  const patch: Record<string, unknown> = {
    status: 'superseded',
    superseded_at: new Date().toISOString(),
  };
  /* Only set the pointer when it's a valid UUID. Otherwise the
     FK would reject — better to leave it null and still mark
     the row superseded. */
  if (successor) patch.superseded_by = successor;

  /* Two attempts. If the successor row hasn't landed yet, wait
     briefly and retry. This is a safety net for any code path
     that bypasses the flush queue. */
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase
      .from('outputs')
      .update(patch)
      .eq('id', id);

    if (!error) return;

    const code = (error as any).code;
    if (code === '23503' && attempt === 0) {
      /* FK violation on first try — the successor insert is
         still in flight. Give it 500ms. */
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    console.warn('[outputs] supersede failed', error.message);
    return;
  }
}

async function doFlushDelete(id: string): Promise<void> {
  const { error } = await supabase.from('outputs').delete().eq('id', id);
  if (error) console.warn('[outputs] delete failed', error.message);
}

/* ---------- Public API ----------
   Every write goes through `enqueue` so ordering holds across
   the whole app — inserts before supersedes before deletes,
   regardless of which caller fires first. */

export function flushDeliverable(d: Deliverable): Promise<void> {
  return enqueue(() => doFlushDeliverable(d));
}

export function flushSupersede(
  id: string,
  supersededBy: string | undefined
): Promise<void> {
  return enqueue(() => doFlushSupersede(id, supersededBy));
}

export function flushDelete(id: string): Promise<void> {
  return enqueue(() => doFlushDelete(id));
}

/* ---------- Reads ---------- */

export async function loadDeliverable(
  id: string
): Promise<Deliverable | null> {
  const { data: row, error: oErr } = await supabase
    .from('outputs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (oErr || !row) return null;

  const { data: payload } = await supabase
    .from('output_payloads')
    .select('snapshot')
    .eq('output_id', id)
    .maybeSingle();

  return rowToDeliverable(
    row as OutputRow,
    (payload?.snapshot ?? null) as ShareSnapshot | null
  );
}

export async function listDeliverables(opts: {
  ventureId?: string;
  pageId?: string;
  limit?: number;
} = {}): Promise<Deliverable[]> {
  let q = supabase
    .from('outputs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.ventureId) q = q.eq('venture_id', opts.ventureId);
  if (opts.pageId) q = q.eq('page_id', opts.pageId);

  const { data: rows, error } = await q;
  if (error || !rows) return [];

  const ids = rows.map((r) => (r as OutputRow).id);
  const { data: payloads } = await supabase
    .from('output_payloads')
    .select('output_id, snapshot')
    .in('output_id', ids);

  const snapshotById = new Map<string, ShareSnapshot>();
  for (const p of payloads ?? []) {
    snapshotById.set(p.output_id as string, p.snapshot as ShareSnapshot);
  }

  return (rows as OutputRow[]).map((row) =>
    rowToDeliverable(row, snapshotById.get(row.id) ?? null)
  );
}
