import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Action,
  AgentBlock,
  AgentRun,
  StatusBlock,
  VenturePageId,
} from '@/lib/types';
import { flushNow } from './agentDrawerPersistence';

/* Returns a valid UUID — required because run ids double as
   `threads.id` in Supabase, which is a uuid column. The prefix
   argument is kept for call-site compatibility but ignored. */
function rid(_prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  /* Fallback for environments without crypto.randomUUID */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* Terminal states finalize the run — the store stamps
   completedAt so persistence and any consumer reading the run
   see a consistent "when did this end". */
const TERMINAL: ReadonlySet<AgentRun['status']> = new Set([
  'done',
  'review_ready',
  'failed',
]);

/* Runs auto-close (leave the dock) when they land at one of these
   statuses. 'review_ready' does NOT close — the founder must still
   validate the output before the run is considered done. */
const AUTO_CLOSE: ReadonlySet<AgentRun['status']> = new Set([
  'done',
  'failed',
]);

/* Guards the persistence subscription during a DB-hydration
   pass — hydrated rows are already in Postgres; re-flushing
   them would be wasted writes. */
let hydratingFromDb = false;

/* ============================================================
   reconcileActiveRun

   When the venture scope changes (navigate from Venture A to
   Venture B), the currently-open run may belong to a different
   venture. If so:
     · switch to the newest in-flight run of the new venture, or
     · close the drawer when the new venture has no runs

   Returns a partial state to merge, or null when no change is
   needed.
   ============================================================ */
function reconcileActiveRun(
  activeVentureId: string | null,
  state: {
    runs: Record<string, AgentRun>;
    activeRunId: string | null;
  }
): Partial<AgentDrawerState> | null {
  const { runs, activeRunId } = state;
  if (!activeVentureId) return null;
  if (!activeRunId) return null;

  const run = runs[activeRunId];
  if (!run) return null;
  if (run.ventureId === activeVentureId) return null;

  /* The active run belongs to a different venture. */
  const next = Object.values(runs)
    .filter(
      (r) =>
        r.ventureId === activeVentureId &&
        (r.status === 'working' || r.status === 'needs_you')
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  if (next) {
    return { activeRunId: next.id };
  }
  return { activeRunId: null, open: false };
}


export type DrawerSize = 'peek' | 'standard' | 'expanded';

/* Stable reference — prevents Zustand re-render loops. */
export const EMPTY_ANSWERS: Record<string, string> = {};

interface AgentDrawerState {
  runs: Record<string, AgentRun>;
  activeRunId: string | null;
  /** The venture whose page is currently rendered. Scoping
   *  selectors read this so a venture page only shows runs that
   *  belong to that venture. Null = no scoping (e.g. Topbar). */
  activeVentureId: string | null;
  runAnswers: Record<string, Record<string, string>>;
  actions: Record<string, Action>;
  open: boolean;
  size: DrawerSize;

  startRun: (input: {
    agentId: string;
    objective: string;
    ventureId?: string;
    ideaId?: string;
    conversationMode?: boolean;
    page?: VenturePageId;
  }) => string;
  updateRun: (runId: string, patch: Partial<AgentRun>) => void;
  emitBlock: (block: AgentBlock) => void;
  endRun: (runId: string, status: AgentRun['status']) => void;
  clearRun: (runId: string) => void;

  recordAnswer: (runId: string, reqId: string, value: string) => void;
  closeBlock: (runId: string, blockId: string, reason: string) => void;
  getAnswers: (runId: string) => Record<string, string>;
  resetRuns: () => void;

  openDrawer: (runId?: string) => void;
  /** Open a run in read-only mode — used when viewing threads of a
   *  closed / validated run from an ops card's 3-dot menu. No
   *  composer, no action buttons. */
  viewOnlyRunId: string | null;
  openRunReadOnly: (runId: string) => void;
  /** Mark a run as closed. Idempotent. The run leaves the dock. */
  closeRun: (runId: string) => void;
  /** Kill an in-flight run. Abandons output (if any), closes the
   *  run, and clears it from the dock. Used when the founder
   *  wants to escape without validating. */
  killRun: (runId: string) => void;
  /** Clear a failed run from the ops card. The run stays in the
   *  DB (audit trail) but its closedReason flips from 'failed' to
   *  'abandoned' so the card returns to the Available state. */
  dismissFailedRun: (runId: string) => void;
  closeDrawer: () => void;
  /** Hydrate a run from Supabase if it isn't in local state.
   *  Resolves to true when the run was loaded. */
  hydrateRun: (runId: string) => Promise<boolean>;
  /** Hydrate MULTIPLE runs from a query result. Merges by id —
   *  local session state wins on overlap. Also sets the active
   *  venture scope. Suppresses the persistence subscription so
   *  hydrated rows aren't re-flushed to Postgres. */
  hydrateRuns: (rows: AgentRun[], ventureId: string) => void;
  setActiveRun: (runId: string | null) => void;
  setActiveVentureId: (id: string | null) => void;
  setSize: (size: DrawerSize) => void;

  prepareAction: (
    input: Omit<Action, 'id' | 'state' | 'preparedAt'>
  ) => string;
  confirmAction: (actionId: string) => void;
  executeAction: (actionId: string) => void;
  recordOutcome: (actionId: string, evidenceUrl?: string) => void;
  failAction: (actionId: string, reason: string) => void;
}

export const useAgentDrawerStore = create<AgentDrawerState>()(
  persist(
    (set, get) => ({
      runs: {},
      actions: {},
      runAnswers: {},
      activeRunId: null,
      activeVentureId: null,
      viewOnlyRunId: null,
      open: false,
      size: 'standard',

      startRun: ({ agentId, objective, ventureId, ideaId, conversationMode, page }) => {
        const id = rid('run');
        const now = new Date().toISOString();

        const initialStatus: StatusBlock = {
          id: rid('blk'),
          runId: id,
          agentId,
          createdAt: now,
          type: 'status',
          state: 'working',
          objective,
        };

        const run: AgentRun = {
          id,
          agentId,
          ventureId,
          ideaId,
          conversationMode,
          page,
          status: 'working',
          objective,
          blocks: [initialStatus],
          startedAt: now,
        };

        set((s) => ({
          runs: { ...s.runs, [id]: run },
          activeRunId: s.activeRunId ?? id,
        }));

        return id;
      },

      updateRun: (runId, patch) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run) return s;
          const next: AgentRun = { ...run, ...patch };
          if (
            next.status !== run.status &&
            TERMINAL.has(next.status) &&
            !next.completedAt
          ) {
            next.completedAt = new Date().toISOString();
          }
          return { runs: { ...s.runs, [runId]: next } };
        }),

      emitBlock: (block) =>
        set((s) => {
          const run = s.runs[block.runId];
          if (!run) return s;
          /* A killed run stops listening. The LLM response may
             still land — it lands on a closed run and is dropped. */
          if (run.closedAt) return s;

          const nextBlocks = [...run.blocks, block];
          const nextStatus =
            block.type === 'status' ? block.state : run.status;

          const nextRun: AgentRun = {
            ...run,
            blocks: nextBlocks,
            status: nextStatus,
          };
          if (
            nextStatus !== run.status &&
            TERMINAL.has(nextStatus) &&
            !nextRun.completedAt
          ) {
            nextRun.completedAt = new Date().toISOString();
          }

          /* Auto-close when the new status is terminal-success or
             terminal-failure. Same rule as endRun — this catches
             status blocks emitted directly (not just via endRun). */
          if (
            block.type === 'status' &&
            AUTO_CLOSE.has(block.state) &&
            !nextRun.closedAt
          ) {
            nextRun.closedAt = new Date().toISOString();
            nextRun.closedReason =
              block.state === 'done' ? 'validated' : 'failed';
          }

          const shouldAutoOpen =
            block.type === 'status' && block.state === 'needs_you';

          return {
            runs: { ...s.runs, [block.runId]: nextRun },
            open: shouldAutoOpen ? true : s.open,
            activeRunId: shouldAutoOpen ? block.runId : s.activeRunId,
          };
        }),

      endRun: (runId, status) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run) return s;
          const now = new Date().toISOString();
          const next: AgentRun = {
            ...run,
            status,
            completedAt: now,
          };
          /* Auto-close on terminal-success or terminal-failure. */
          if (AUTO_CLOSE.has(status) && !next.closedAt) {
            next.closedAt = now;
            next.closedReason = status === 'done' ? 'validated' : 'failed';
          }
          return { runs: { ...s.runs, [runId]: next } };
        }),

      clearRun: (runId) =>
        set((s) => {
          const { [runId]: _removed, ...restRuns } = s.runs;
          const { [runId]: _removedAnswers, ...restAnswers } = s.runAnswers;
          return {
            runs: restRuns,
            runAnswers: restAnswers,
            activeRunId: s.activeRunId === runId ? null : s.activeRunId,
          };
        }),

      recordAnswer: (runId, reqId, value) =>
        set((s) => ({
          runAnswers: {
            ...s.runAnswers,
            [runId]: { ...(s.runAnswers[runId] ?? EMPTY_ANSWERS), [reqId]: value },
          },
        })),

      closeBlock: (runId: string, blockId: string, reason: string) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run) return s;
          const now = new Date().toISOString();
          return {
            runs: {
              ...s.runs,
              [runId]: {
                ...run,
                blocks: run.blocks.map((b: any) =>
                  b.id === blockId
                    ? {
                        ...b,
                        state: 'done',
                        closed_at: now,
                        closed_reason: reason,
                        completed_at: now,
                      }
                    : b,
                ),
              },
            },
          };
        }),

      getAnswers: (runId) => get().runAnswers[runId] ?? EMPTY_ANSWERS,

      resetRuns: () =>
        set({
          runs: {},
          runAnswers: {},
          activeRunId: null,
          open: false,
        }),

      openDrawer: (runId) => {
        const s = get();
        const scope = s.activeVentureId;
        const candidates = Object.values(s.runs).filter(
          (r) => !scope || r.ventureId === scope
        );

        let target: string | null = runId ?? s.activeRunId;

        /* When no explicit runId and the active run is a completed
           one, prefer the newest in-flight run — otherwise the
           founder reopens the drawer onto a finished run. */
        if (!runId && target) {
          const active = s.runs[target];
          if (active?.status === 'done') {
            const inFlight = candidates
              .filter((r) => r.status !== 'done')
              .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
            if (inFlight) target = inFlight.id;
          }
        }

        /* Fall back to the newest run when the founder has never
           opened the drawer before. */
        if (!target) {
          const newest = candidates.sort((a, b) =>
            b.startedAt.localeCompare(a.startedAt)
          )[0];
          target = newest?.id ?? null;
        }

        set({ open: true, activeRunId: target, viewOnlyRunId: null });

        if (target && !s.runs[target]) {
          void get().hydrateRun(target);
        }
      },

      openRunReadOnly: async (runId) => {
        /* Hydrate the run if it isn't in local state — this is the
           path used when the founder opens a closed run from the
           ops card's 3-dot menu. */
        const local = get().runs[runId];
        if (!local) {
          const { loadRun } = await import('./agentDrawerPersistence');
          const loaded = await loadRun(runId);
          if (!loaded) return;
          set((s) => ({ runs: { ...s.runs, [loaded.id]: loaded } }));
        }
        set({ open: true, activeRunId: runId, viewOnlyRunId: runId });
      },

      closeRun: (runId) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run || run.closedAt) return s;
          return {
            runs: {
              ...s.runs,
              [runId]: {
                ...run,
                closedAt: new Date().toISOString(),
                closedReason:
                  run.status === 'done' ? 'validated' : 'dismissed',
              },
            },
          };
        }),

      killRun: (runId) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run || run.closedAt) return s;
          const now = new Date().toISOString();
          /* Status stays as-is — the run was working / needs_you /
             review_ready when the founder killed it. Only closedAt
             and closedReason describe the ending. Setting status to
             'failed' would make abandoned runs look like system
             failures in every surface that filters on status. */
          const next: AgentRun = {
            ...run,
            completedAt: now,
            closedAt: now,
            closedReason: 'abandoned',
          };
          return {
            runs: { ...s.runs, [runId]: next },
            open: s.activeRunId === runId ? false : s.open,
            activeRunId: s.activeRunId === runId ? null : s.activeRunId,
            viewOnlyRunId:
              s.viewOnlyRunId === runId ? null : s.viewOnlyRunId,
          };
        }),

      dismissFailedRun: (runId) =>
        set((s) => {
          const run = s.runs[runId];
          if (!run || run.closedReason !== 'failed') return s;
          /* Flip 'failed' to 'abandoned'. The run stays closed; the
             card no longer reads the failure. */
          return {
            runs: {
              ...s.runs,
              [runId]: { ...run, closedReason: 'abandoned' },
            },
          };
        }),

      hydrateRun: async (runId) => {
        const local = get().runs[runId];
        if (local) return true;
        const { loadRun } = await import('./agentDrawerPersistence');
        const run = await loadRun(runId);
        if (!run) return false;
        set((s) => ({ runs: { ...s.runs, [run.id]: run } }));
        return true;
      },

      hydrateRuns: (rows, ventureId) => {
        hydratingFromDb = true;
        try {
          set((s) => {
            const nextRuns = { ...s.runs };
            let changed = false;
            for (const r of rows) {
              if (!nextRuns[r.id]) {
                nextRuns[r.id] = r;
                changed = true;
              }
            }

            const base = {
              runs: changed ? nextRuns : s.runs,
              activeVentureId: ventureId,
            };

            /* If the drawer is open on a run from a different
               venture, reconcile — either switch to this
               venture's in-flight run or close. */
            const reconcile = reconcileActiveRun(ventureId, {
              runs: base.runs,
              activeRunId: s.activeRunId,
            });

            if (!changed && s.activeVentureId === ventureId && !reconcile) {
              return s;
            }

            return { ...base, ...(reconcile ?? {}) };
          });
        } finally {
          hydratingFromDb = false;
        }
      },

      setActiveVentureId: (id) => {
        set((s) => {
          const reconcile = reconcileActiveRun(id, {
            runs: s.runs,
            activeRunId: s.activeRunId,
          });
          return { activeVentureId: id, ...(reconcile ?? {}) };
        });
      },

      closeDrawer: () => set({ open: false, viewOnlyRunId: null }),

      setActiveRun: (runId) => set({ activeRunId: runId }),

      setSize: (size) => set({ size }),

      prepareAction: (input) => {
        const id = rid('act');
        const now = new Date().toISOString();
        const action: Action = {
          ...input,
          id,
          state: 'prepared',
          preparedAt: now,
        };
        set((s) => ({ actions: { ...s.actions, [id]: action } }));
        return id;
      },

      confirmAction: (actionId) =>
        set((s) => {
          const action = s.actions[actionId];
          if (!action || action.state !== 'prepared') return s;
          return {
            actions: {
              ...s.actions,
              [actionId]: {
                ...action,
                state: 'confirmed',
                confirmedAt: new Date().toISOString(),
              },
            },
          };
        }),

      executeAction: (actionId) =>
        set((s) => {
          const action = s.actions[actionId];
          if (!action || action.state !== 'confirmed') return s;
          return {
            actions: {
              ...s.actions,
              [actionId]: {
                ...action,
                state: 'live',
                executedAt: new Date().toISOString(),
              },
            },
          };
        }),

      recordOutcome: (actionId, evidenceUrl) =>
        set((s) => {
          const action = s.actions[actionId];
          if (!action || action.state !== 'live') return s;
          return {
            actions: {
              ...s.actions,
              [actionId]: {
                ...action,
                state: 'proven',
                provenAt: new Date().toISOString(),
                evidenceUrl: evidenceUrl ?? action.evidenceUrl,
              },
            },
          };
        }),

      failAction: (actionId, reason) =>
        set((s) => {
          const action = s.actions[actionId];
          if (!action) return s;
          return {
            actions: {
              ...s.actions,
              [actionId]: { ...action, failureReason: reason },
            },
          };
        }),
    }),
    {
      name: 'iv-agent-drawer-store',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({
        runs: state.runs,
        actions: state.actions,
        runAnswers: state.runAnswers,
        size: state.size,
      }),
      migrate: (persisted: any, version) => {
        /* v3 introduced DB persistence with UUID run ids. Old
           run_xxx ids aren't valid uuids — clear them rather
           than send rejected rows to Postgres. */
        if (version < 3) {
          return {
            runs: {},
            actions: {},
            runAnswers: {},
            size: 'standard',
          };
        }
        return persisted;
      },
    }
  )
);

export const usePendingAgentCount = () =>
  useAgentDrawerStore((s) => {
    const scope = s.activeVentureId;
    return Object.values(s.runs).filter(
      (r) =>
        !r.closedAt &&
        r.status === 'needs_you' &&
        (!scope || r.ventureId === scope)
    ).length;
  });

/* Active-run selector — every surface that asks "what's in flight
   right now?" reads from this. Closed runs (validated, failed,
   abandoned, dismissed) never appear — they're history, not
   alerts. */
export const useActiveRuns = () =>
  useAgentDrawerStore((s) => {
    const scope = s.activeVentureId;
    return Object.values(s.runs)
      .filter(
        (r) =>
          !r.closedAt &&
          (!scope || r.ventureId === scope) &&
          (r.status === 'working' ||
            r.status === 'needs_you' ||
            r.status === 'review_ready')
      )
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  });

/* Runs that need the founder specifically (review_ready or
   needs_you, not closed). Used by any alert surface. */
export const useRunsNeedingAttention = () =>
  useAgentDrawerStore((s) => {
    const scope = s.activeVentureId;
    return Object.values(s.runs)
      .filter(
        (r) =>
          !r.closedAt &&
          (!scope || r.ventureId === scope) &&
          (r.status === 'needs_you' || r.status === 'review_ready')
      )
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  });

export const useAgentRuns = () =>
  useAgentDrawerStore((s) => {
    const scope = s.activeVentureId;
    return Object.values(s.runs)
      .filter((r) => !scope || r.ventureId === scope)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  });

export const useActiveRun = () =>
  useAgentDrawerStore((s) =>
    s.activeRunId ? s.runs[s.activeRunId] ?? null : null
  );

export const useActionsByState = () =>
  useAgentDrawerStore((s) => {
    const groups: Record<Action['state'], Action[]> = {
      prepared: [],
      confirmed: [],
      live: [],
      proven: [],
      failed: [],
    };
    for (const a of Object.values(s.actions)) {
      groups[a.state].push(a);
    }
    return groups;
  });

/* ============================================================
   Persistence subscription — the sidecar.

   Writes happen at exactly two points per run:

     · startRun  → insert the thread row (FK anchor for outputs)
     · endRun    → finalize the row with the full block timeline

   No incremental writes. The store is the live state during a
   run; the DB is the record of a completed run. Outputs are the
   durable artifacts and are persisted separately by the
   deliverables layer.

   A run that never reaches a terminal status never finalizes.
   That's intentional — abandoned runs aren't worth the storage.
   ============================================================ */
let persistenceInstalled = false;

export function installAgentDrawerPersistence(): void {
  if (persistenceInstalled) return;
  persistenceInstalled = true;

  useAgentDrawerStore.subscribe((state, prev) => {
    /* Skip flushes during hydration — those rows are already
       in Postgres. */
    if (hydratingFromDb) return;

    for (const [id, run] of Object.entries(state.runs)) {
      const prevRun = prev.runs[id];

      /* New run — insert the row with whatever state exists now */
      if (!prevRun) {
        flushNow(run);
        continue;
      }

      /* opId set — capture the op linkage immediately. The opId
         is usually assigned just after startRun, so this is one
         write per op run and makes `threads.op_id` reliable for
         queries like "all runs for op X". */
      if (!prevRun.opId && run.opId) {
        flushNow(run);
        continue;
      }

      /* closedAt flipped — flush immediately so the dock filter
         reflects reality on the next fetch. */
      if (!prevRun.closedAt && run.closedAt) {
        flushNow(run);
        continue;
      }

      /* closedReason flipped (failed → abandoned) — flush so the
         ops card re-renders clean on next query. */
      if (prevRun.closedReason !== run.closedReason) {
        flushNow(run);
        continue;
      }

      /* Rest or terminal status — flush the row. `needs_you` is
         not terminal, but the run must survive a reload so the
         founder can answer the question after refresh. */
      const becameRest =
        prevRun.status !== run.status &&
        (run.status === 'needs_you' ||
          run.status === 'done' ||
          run.status === 'review_ready' ||
          run.status === 'failed');

      if (becameRest) {
        flushNow(run);
      }
    }
  });
}

installAgentDrawerPersistence();
/* ============================================================
   One-time normalization.

   Runs persisted before the completedAt-stamping fix may sit at
   a terminal status with completedAt: null. Stamp them now so
   the store is internally consistent, then flush once so the DB
   matches.
   ============================================================ */
function normalizePersistedRuns(): void {
  const state = useAgentDrawerStore.getState();
  const now = new Date().toISOString();
  let mutated = false;

  for (const [id, run] of Object.entries(state.runs)) {
    if (TERMINAL.has(run.status) && !run.completedAt) {
      state.runs[id] = { ...run, completedAt: now };
      mutated = true;
      /* Flush once so the DB matches the normalized store. */
      flushNow(state.runs[id]);
    }
  }

  if (mutated) {
    useAgentDrawerStore.setState({ runs: { ...state.runs } });
  }
}

normalizePersistedRuns();
