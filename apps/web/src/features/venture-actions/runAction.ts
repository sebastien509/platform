import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { getTier } from '@/lib/stores/tierStore';
import { canRunOp } from '@/lib/config/tiers';

/** Returned by runAction when the tier can't run this op. */
export const PREMIUM_BLOCKED_SENTINEL = '__premium_blocked__';
import { supabase } from '@/lib/supabase';
import { useShareStore } from '@/lib/share';
import { getActionDef } from './page-actions';
import { runOp, runOpNext } from '@/lib/api/ventureAgent';
import type { ActionDef, RequireInput } from './page-actions';
import type { AgentRun } from '@/lib/types';

/* ============================================================
   PAGE → AGENT MAPPING

   Values match the `agentKey` in appsRegistry (base agents).
   The drawer manifests must export matching ids.
   ============================================================ */
const PAGE_AGENT_MAP: Record<string, string> = {
  strategy: 'strategy',
  product: 'product',
  engineering: 'engineering',
  gtm: 'gtm',
  campaigns: 'campaign',
  sales: 'sales',
  growth: 'growth',
  analytics: 'analysis',
  knowledge: 'knowledge',
  outcomes: 'outcomes',
  funding: 'strategy',
};

interface RunActionContext {
  ventureId?: string;
  pageId: string;
}

/* ============================================================
   Helpers
   ============================================================ */

function rid(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/* Terminal/rest statuses the run can be in. `working` and
   `needs_you` mean the run is actively in flight. */
const IN_FLIGHT: ReadonlySet<AgentRun['status']> = new Set([
  'working',
  'needs_you',
]);

/* ============================================================
   Idempotency guard

   If a run for the same (opId, pageId, ventureId) is already
   in flight, reuse it instead of spawning a duplicate.
   ============================================================ */
function findInFlightRun(
  opId: string,
  pageId: string,
  ventureId: string | undefined
): AgentRun | undefined {
  const runs = useAgentDrawerStore.getState().runs;
  return Object.values(runs).find((r) => {
    if ((r as any).opId !== opId) return false;
    if (r.page !== pageId) return false;
    if (ventureId && r.ventureId !== ventureId) return false;
    if (!IN_FLIGHT.has(r.status)) return false;
    return true;
  });
}

/* ============================================================
   Block emitters
   ============================================================ */

function emitStep(
  runId: string,
  agentId: string,
  label: string,
  complete: boolean
) {
  const store = useAgentDrawerStore.getState();
  store.emitBlock({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'step',
    label,
    startedAt: nowISO(),
    completedAt: complete ? nowISO() : undefined,
  });
}

function emitError(
  runId: string,
  agentId: string,
  err: unknown,
  def: ActionDef
) {
  const store = useAgentDrawerStore.getState();
  const msg =
    err instanceof Error ? err.message : 'unknown error';

  store.emitBlock({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'error',
    message: `${def.verb} failed: ${msg}`,
    actions: ['retry', 'ignore'],
  });

  /* Also flip the run status — the drawer's pill should read
     "Failed", not sit at "Working" forever. */
  store.emitBlock({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'status',
    state: 'failed',
    objective: `${def.verb} failed`,
  });
}

function emitRequireBlock(runId: string, agentId: string, req: RequireInput) {
  const store = useAgentDrawerStore.getState();

  if (req.kind === 'question') {
    store.emitBlock({
      id: req.id,
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'question',
      prompt: req.prompt,
      options: req.options,
      freeText: req.freeText,
    });
  } else if (req.kind === 'file_request') {
    store.emitBlock({
      id: req.id,
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'file_request',
      prompt: req.prompt,
      acceptedKinds: req.acceptedKinds ?? ['pdf'],
      destinationHint: req.destinationHint,
    });
  } else if (req.kind === 'approval') {
    store.emitBlock({
      id: req.id,
      runId,
      agentId,
      createdAt: nowISO(),
      type: 'approval',
      /* targetOutputId is filled when the op targets a real
         output. Placeholder empty string is safer than reusing
         the require's own id, which pointed nowhere. */
      targetOutputId: '',
      prompt: req.prompt,
      approveLabel: req.approveLabel,
      rejectLabel: req.rejectLabel,
    });
  }

  store.emitBlock({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'status',
    state: 'needs_you',
    objective: req.prompt.slice(0, 80),
  });
}

/* ============================================================
   Output emission
   ============================================================ */

function kindForPayload(payload: any): string {
  if (!payload || !payload.type) return 'document';
  switch (payload.type) {
    case 'json':
      return 'table';
    case 'text':
      return 'file';
    case 'email_batch':
      return 'email_batch';
    case 'action':
      return 'action';
    case 'email':
    case 'html':
    case 'link':
    case 'confirm':
    default:
      return 'document';
  }
}

/* ============================================================
   fetchVentureContext

   The LLM needs to know WHAT venture it's working on. This
   reads the venture row + the source idea's structured card
   and flattens them into the context the agent expects.

   Called once per op run, before runOp. Two small reads.
   ============================================================ */
async function fetchVentureContext(ventureId: string | undefined) {
  if (!ventureId) return { id: '' };

  const { data: venture, error: vErr } = await supabase
    .from('ventures')
    .select('id, name, description, source_idea_id')
    .eq('id', ventureId)
    .maybeSingle();

  if (vErr || !venture) {
    return { id: ventureId };
  }

  const base = {
    id: venture.id,
    name: venture.name ?? undefined,
    description: venture.description ?? undefined,
  };

  if (!venture.source_idea_id) return base;

  const { data: idea } = await supabase
    .from('ideas')
    .select('structured')
    .eq('id', venture.source_idea_id)
    .maybeSingle();

  if (!idea?.structured) return base;

  const s = idea.structured as any;
  return {
    ...base,
    problem: s.problem?.value ?? undefined,
    persona: s.persona?.value ?? undefined,
    value: s.value?.value ?? undefined,
    sector: s.sector?.value ?? undefined,
  };
}

async function proceedToOutput(
  runId: string,
  agentId: string,
  def: ActionDef,
  ctx: RunActionContext
) {
  const store = useAgentDrawerStore.getState();

  store.emitBlock({
    id: rid(),
    runId,
    agentId,
    createdAt: nowISO(),
    type: 'status',
    state: 'working',
    objective: `Producing ${def.verb.toLowerCase()}…`,
  });

  /* ══════════════════════════════════════════════════════════
     LLM PATH — when def.agentMethod === 'runOp', the venture
     agent produces the content. Falls back to the mock path
     on any error so the pipeline never goes dark.
     ══════════════════════════════════════════════════════════ */
  if (def.agentMethod === 'runOp') {
    try {
      const run = store.runs[runId];
      const answers = store.getAnswers(runId);
      const ventureId = ctx.ventureId ?? run?.ventureId ?? '';

      // without sibling context for now; add when we see quality gain.)

      emitStep(runId, agentId, 'Reading context…', true);

      /* Fetch the venture row + source idea card so the LLM has
         real content to work with. Without this the model writes
         generic template filler. */
      const ventureCtx = await fetchVentureContext(ventureId);

      const out = await runOp({
        operation: {
          id: def.id,
          verb: def.verb,
          description: def.description,
          produces: def.produces,
          destination: def.destination,
          renderType: def.renderType,
          surfaceId: def.surfaceId,
          /* mode + connector let the LLM know whether this is an
             in-platform op or an outbound connected op. */
          mode: def.mode,
          connector: def.connector,
          /* expectedOutputKind pins the shape — when set, the
             edge function narrows the response schema. Removes
             all interpretation. */
          expectedOutputKind: def.expectedOutputKind,
        },
        venture: ventureCtx,
        pageId: ctx.pageId,
        answers,
      });

      emitStep(runId, agentId, `${def.verb} produced an artifact`, true);
      /* Shared note for connected-but-not-shipped ops. */
      const fallbackNote =
        def.mode === 'connected' && def.connector
          ? `Preview ready — connect ${def.connector} to ship automatically.`
          : null;

      /* Dispatch on the LLM's output kind. Each branch emits an
         output block shaped for that kind. */
      switch (out.kind) {
        case 'snapshot': {
          const surfaceId = (def.surfaceId ?? 'strategy.brief') as any;
          const linkId = useShareStore.getState().createLink({
            surfaceId,
            ventureId: ventureId || '',
            snapshot: out.snapshot,
            createdBy: 'Founder',
            commentsEnabled: true,
            expiresAt: null,
          });

          store.emitBlock({
            id: rid(),
            runId,
            agentId,
            createdAt: nowISO(),
            type: 'output',
            kind: 'document',
            title: out.snapshot.title || def.verb,
            destination: def.destination,
            status: 'needs_review',
            previewHref: `surface:${linkId}`,
          });
          break;
        }

        case 'payload': {
          store.emitBlock({
            id: rid(),
            runId,
            agentId,
            createdAt: nowISO(),
            type: 'output',
            kind: kindForPayload(out.payload) as any,
            title: def.verb,
            destination: def.destination,
            status: 'needs_review',
            previewHref: `payload:${def.id}`,
            payload: out.payload,
          });
          break;
        }

        case 'action': {
          store.emitBlock({
            id: rid(),
            runId,
            agentId,
            createdAt: nowISO(),
            type: 'output',
            kind: 'action' as any,
            title: out.action.verb,
            destination: def.destination,
            status: 'needs_review',
            previewHref: `action:${def.id}`,
            payload: { action: out.action },
          });
          break;
        }

        case 'confirm': {
          store.emitBlock({
            id: rid(),
            runId,
            agentId,
            createdAt: nowISO(),
            type: 'output',
            kind: 'document',
            title: out.confirm.heading,
            destination: def.destination,
            status: 'needs_review',
            previewHref: `payload:${def.id}`,
            payload: {
              type: 'confirm',
              heading: out.confirm.heading,
              body: out.confirm.body,
            },
          });
          break;
        }
      }

      store.emitBlock({
        id: rid(),
        runId,
        agentId,
        createdAt: nowISO(),
        type: 'status',
        state: 'review_ready',
        objective: fallbackNote ?? `${def.verb} — ready for review`,
      });
      return;
    } catch (err) {
      /* LLM path failed — emit error and STOP. Do not fall
         through to the mock path — the founder needs to see
         the failure, not silent mock data. */
      emitError(runId, agentId, err, def);
      return;
    }
  }

  /* ══════════════════════════════════════════════════════════
     MOCK PATH — used when def.agentMethod is unset.
     ══════════════════════════════════════════════════════════ */

  /* ─── Path A — op has an HTML surface ─── */
  if (def.surfaceId && def.buildSnapshot) {
    const surfaceId = def.surfaceId;
    const buildSnapshot = def.buildSnapshot;

    setTimeout(() => {
      try {
        const linkId = useShareStore.getState().createLink({
          surfaceId,
          ventureId: ctx.ventureId ?? '',
          snapshot: buildSnapshot(),
          createdBy: 'Founder',
          commentsEnabled: true,
          expiresAt: null,
        });

        emitStep(runId, agentId, `${def.verb} produced an artifact`, true);

        store.emitBlock({
          id: rid(),
          runId,
          agentId,
          createdAt: nowISO(),
          type: 'output',
          kind: 'document',
          title: def.verb,
          destination: def.destination,
          status: 'needs_review',
          previewHref: `surface:${linkId}`,
        });

        const fallbackNote =
          def.mode === 'connected' && def.connector
            ? `Preview ready — connect ${def.connector} to ship automatically.`
            : null;

        store.emitBlock({
          id: rid(),
          runId,
          agentId,
          createdAt: nowISO(),
          type: 'status',
          state: 'review_ready',
          objective: fallbackNote ?? `${def.verb} — ready for review`,
        });
      } catch (err) {
        emitError(runId, agentId, err, def);
      }
    }, 1200);
    return;
  }

  /* ─── Path B — op has a payload builder ─── */
  if (def.build) {
    const build = def.build;

    setTimeout(() => {
      try {
        const payload = build();

        emitStep(runId, agentId, `${def.verb} produced output`, true);

        store.emitBlock({
          id: rid(),
          runId,
          agentId,
          createdAt: nowISO(),
          type: 'output',
          kind: kindForPayload(payload) as any,
          title: def.verb,
          destination: def.destination,
          status: 'needs_review',
          previewHref: `payload:${def.id}`,
          payload,
        });

        const fallbackNote =
          def.mode === 'connected' && def.connector
            ? `Preview ready — connect ${def.connector} to ship automatically.`
            : null;

        store.emitBlock({
          id: rid(),
          runId,
          agentId,
          createdAt: nowISO(),
          type: 'status',
          state: 'review_ready',
          objective: fallbackNote ?? `${def.verb} — ready for review`,
        });
      } catch (err) {
        emitError(runId, agentId, err, def);
      }
    }, 1000);
    return;
  }

  /* ─── Path C — pure confirmation ─── */
  setTimeout(() => {
    try {
      emitStep(runId, agentId, `${def.verb} complete`, true);
      store.emitBlock({
        id: rid(),
        runId,
        agentId,
        createdAt: nowISO(),
        type: 'status',
        state: 'done',
        objective: `${def.verb} finished`,
      });
    } catch (err) {
      emitError(runId, agentId, err, def);
    }
  }, 800);
}

/* ============================================================
   agentDrivenQuestion — the agent decides which question to ask
   next, adapting to venture context and prior answers.

   Falls back to the op's static `requires` array when:
     · the edge call fails
     · the agent returns nothing useful
     · the op has no `requires` and no venture context to mine

   Never blocks the founder. Worst case, they answer the same
   static questions they would have answered before.
   ============================================================ */

async function agentDrivenQuestion(
  runId: string,
  agentId: string,
  def: ActionDef,
  ctx: RunActionContext,
  standardQuestions: RequireInput[],
  answers: Record<string, string>,
): Promise<void> {
  const store = useAgentDrawerStore.getState();
  const run = store.runs[runId];
  if (!run) return;

  /* ── Build the exchanges array from prior blocks ──
   * Each question block has an id + prompt; the answer lives in
   * the answers map. confirmedLabel is best-effort from the
   * question's kind. */
  /* Build exchanges from EVERY block that has a recorded answer.
   * Blocks come in different shapes — 'question' blocks have a
   * `prompt`, 'status' blocks have an `objective`. Both are valid
   * carriers of a founder's answer, so we accept either. */
  const exchanges = run.blocks
    .filter((b): b is any => !!answers[(b as any).id])
    .map((b: any) => ({
      id: b.id,
      question: b.prompt ?? b.objective ?? b.question ?? '',
      answer: answers[b.id] ?? '',
      confirmedLabel: null,
    }));

  const covered = exchanges.map((e) => e.id);
  const remaining = Math.max(0, 5 - exchanges.length);

  /* ── No standard questions + no remaining budget → proceed ── */
  if (remaining === 0) {
    await proceedToOutput(runId, agentId, def, ctx);
    return;
  }

  /* ── Ask the agent ── */
  let nextQuestion: {
    question: string | null;
    options: Array<{ label: string; value: string; primary: boolean }>;
    freeText: boolean;
    complete: boolean;
    confirmedLabel: string | null;
  } | null = null;

  try {
    nextQuestion = await runOpNext({
      ventureId: ctx.ventureId,
      operation: {
        id: def.id,
        verb: def.verb,
        description: def.description,
        produces: def.produces,
        destination: def.destination,
        renderType: def.renderType,
      },
      standardQuestions: standardQuestions.map((r) => ({
        id: r.id,
        prompt: r.prompt,
        options: r.options?.map((o) => ({
          label: o.label,
          value: o.value,
          primary: o.primary ?? false,
        })),
        freeText: r.freeText,
      })),
      exchanges,
      covered,
      followUpsRemaining: remaining,
    });
  } catch (err) {
    console.warn('[runAction] runOpNext failed, falling back to static', err);
  }

  /* ── Fallback: static question from `requires` ── */
  if (!nextQuestion) {
    const nextStatic = standardQuestions.find((r) => !answers[r.id]);
    if (nextStatic) {
      emitRequireBlock(runId, agentId, nextStatic);
    } else {
      await proceedToOutput(runId, agentId, def, ctx);
    }
    return;
  }

  /* ── Agent said we're done ── */
  if (nextQuestion.complete || !nextQuestion.question) {
    await proceedToOutput(runId, agentId, def, ctx);
    return;
  }

  /* ── Emit the agent's question ── */
  const req: RequireInput = {
    id: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    kind: 'question',
    prompt: nextQuestion.question,
    options: nextQuestion.options.length > 0
      ? nextQuestion.options.map((o) => ({
          label: o.label,
          value: o.value,
          primary: o.primary,
        }))
      : undefined,
    freeText: nextQuestion.freeText || nextQuestion.options.length === 0,
  };

  emitRequireBlock(runId, agentId, req);
}

/* ============================================================
   Public API
   ============================================================ */

export function runAction(def: ActionDef, ctx: RunActionContext): string {
  /* Premium op gate — some ops are Founder+ only. We return a
   * sentinel string instead of a runId; the caller detects it
   * and shows the gate. */
  const tier = getTier();
  if (!canRunOp(tier, def.id)) {
    return PREMIUM_BLOCKED_SENTINEL;
  }

  const store = useAgentDrawerStore.getState();

  /* Idempotency guard — never spawn a duplicate in-flight run
     for the same op on the same page + venture. */
  const existing = findInFlightRun(def.id, ctx.pageId, ctx.ventureId);
  if (existing) {
    store.setActiveRun(existing.id);
    store.openDrawer(existing.id);
    return existing.id;
  }

  const agentId = PAGE_AGENT_MAP[ctx.pageId] ?? 'research';

  const runId = store.startRun({
    agentId,
    objective: def.verb,
    ventureId: ctx.ventureId,
    page: ctx.pageId as any,
    conversationMode: def.conversationMode ?? false,
  });

  store.updateRun(runId, {
    opId: def.id,
    opIcon: def.icon ?? 'sparkles',
    opVerb: def.verb,
  } as any);

  emitStep(runId, agentId, `Starting ${def.verb.toLowerCase()}…`, false);

  const requires = def.requires ?? [];

  /* Agent-driven Q&A — the op's standard questions seed the
   * conversation, but the agent adapts them to the venture's
   * context. Falls back to static requires on error. */
  setTimeout(() => {
    try {
      void agentDrivenQuestion(runId, agentId, def, ctx, requires, {});
    } catch (err) {
      emitError(runId, agentId, err, def);
    }
  }, 900);

  store.setActiveRun(runId);
  store.openDrawer(runId);
  return runId;
}

export function resumeRun(runId: string, reqId: string, value: string) {
  const store = useAgentDrawerStore.getState();
  const run = store.runs[runId];
  if (!run) return;

  /* Derive context from the persisted run — no memory-only Map. */
  const opId = (run as any).opId;
  if (!opId) return;
  const def = getActionDef(opId);
  if (!def) return;

  /* Verify the block being answered is real and answerable. */
  const block = run.blocks.find((b) => b.id === reqId);
  if (!block) return;
  const answerable =
    block.type === 'question' ||
    block.type === 'file_request' ||
    block.type === 'approval';
  if (!answerable) return;

  store.recordAnswer(runId, reqId, value);

  emitStep(runId, run.agentId, `Set: ${value}`, true);

  const answers = store.getAnswers(runId);

  /* Hand back to the agent — it decides whether to ask another
   * question, or proceed to the output now that it has enough. */
  setTimeout(() => {
    try {
      void agentDrivenQuestion(
        runId,
        run.agentId,
        def,
        { ventureId: run.ventureId, pageId: run.page ?? 'strategy' },
        def.requires ?? [],
        answers,
      );
    } catch (err) {
      emitError(runId, run.agentId, err, def);
    }
  }, 600);
}

