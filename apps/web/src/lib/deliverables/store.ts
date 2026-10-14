import { create } from 'zustand';
import { getTier } from '@/lib/stores/tierStore';
import { TIER_CONFIG } from '@/lib/config/tiers';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Deliverable } from './types';
import {
  flushDeliverable,
  flushSupersede,
  flushDelete,
} from './persistence';

interface DeliverablesState {
  deliverables: Record<string, Deliverable>;

  addDeliverable: (
    input: Omit<Deliverable, 'id' | 'createdAt' | 'version' | 'status'>
  ) => string;
  getDeliverable: (id: string) => Deliverable | undefined;
  getLatestFor: (pageId: string, opId: string) => Deliverable | undefined;
  getForPage: (pageId: string) => Deliverable[];
  getSuperseded: (ventureId?: string) => Deliverable[];
  supersede: (id: string) => void;
  removeDeliverable: (id: string) => void;
  /** Set the given deliverable as the active version of its
   *  (pageId, opId, ventureId) group. Every sibling becomes
   *  superseded by it. The target's status flips to 'validated'. */
  setActiveVersion: (id: string) => void;
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  hydrate: (rows: Deliverable[], ventureId: string) => void;

  activeVentureId: string | null;
  setActiveVentureId: (id: string | null) => void;
}

/* Returns a valid UUID — the id doubles as outputs.id */
function rid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* When hydrating from DB, the subscription must not re-flush
   the same rows back. This module-level flag is set/cleared
   synchronously around the hydrate setState. */
let hydratingFromDb = false;

export const useDeliverablesStore = create<DeliverablesState>()(
  persist(
    (set, get) => ({
      deliverables: {},
      activeVentureId: null,

      addDeliverable: (input) => {
        const id = rid();
        const now = new Date().toISOString();

        /* Next version number for this (pageId, opId). */
        const siblings = Object.values(get().deliverables).filter(
          (d) => d.pageId === input.pageId && d.opId === input.opId
        );
        const nextVersion =
          siblings.length === 0
            ? 1
            : Math.max(...siblings.map((s) => s.version)) + 1;

        /* Supersede every prior validated sibling. */
        const priorValidated = siblings.filter(
          (s) => s.status === 'validated'
        );

        const record: Deliverable = {
          ...input,
          id,
          version: nextVersion,
          status: 'validated',
          createdAt: now,
          validatedAt: now,
        };

        /* Version limit — Pro keeps 3 per (pageId, opId). Founder
         * and Team keep everything. The oldest superseded rows are
         * removed locally; the persistence subscriber deletes them
         * from the DB. */
        const tier = getTier();
        const cfg = TIER_CONFIG[tier];
        const versionCap = cfg.versionsPerDeliverable;
        const isUnlimited = versionCap === Infinity || versionCap === 0;

        /* The version list for this op, sorted newest first, PLUS
         * the record we're about to add. If a Pro founder hits the
         * cap, the excess old versions get pruned. */
        const allSiblingsForPrune = [
          ...siblings.map((s) => s.version),
          nextVersion,
        ].sort((a, b) => b - a);
        const versionsToDrop = new Set<number>(
          isUnlimited ? [] : allSiblingsForPrune.slice(versionCap),
        );

        set((s) => {
          const next = { ...s.deliverables, [id]: record };
          for (const prior of priorValidated) {
            next[prior.id] = {
              ...prior,
              status: 'superseded',
              supersededAt: now,
              supersededBy: id,
            };
          }

          /* Prune excess versions if we're over the cap. */
          if (versionsToDrop.size > 0) {
            for (const sib of siblings) {
              if (versionsToDrop.has(sib.version)) {
                delete next[sib.id];
              }
            }
          }
          return { deliverables: next };
        });

        return id;
      },

      getDeliverable: (id) => get().deliverables[id],

      getLatestFor: (pageId, opId) => {
        const siblings = Object.values(get().deliverables).filter(
          (d) => d.pageId === pageId && d.opId === opId
        );
        if (siblings.length === 0) return undefined;
        return siblings.sort((a, b) => b.version - a.version)[0];
      },

      getForPage: (pageId) =>
        Object.values(get().deliverables)
          .filter((d) => d.pageId === pageId && d.status === 'validated')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      getSuperseded: (ventureId) =>
        Object.values(get().deliverables)
          .filter(
            (d) =>
              d.status === 'superseded' &&
              (!ventureId || d.ventureId === ventureId)
          )
          .sort((a, b) =>
            (b.supersededAt ?? '').localeCompare(a.supersededAt ?? '')
          ),

      supersede: (id) =>
        set((s) => {
          const d = s.deliverables[id];
          if (!d) return s;
          return {
            deliverables: {
              ...s.deliverables,
              [id]: {
                ...d,
                status: 'superseded',
                supersededAt: new Date().toISOString(),
              },
            },
          };
        }),

      removeDeliverable: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.deliverables;
          return { deliverables: rest };
        }),

      setActiveVersion: (id) =>
        set((s) => {
          const target = s.deliverables[id];
          if (!target) return s;

          const siblings = Object.values(s.deliverables).filter(
            (d) =>
              d.pageId === target.pageId &&
              d.opId === target.opId &&
              d.ventureId === target.ventureId
          );

          const now = new Date().toISOString();
          const next = { ...s.deliverables };

          for (const sib of siblings) {
            if (sib.id === id) {
              next[sib.id] = {
                ...sib,
                status: 'validated',
                supersededAt: undefined,
                supersededBy: undefined,
                validatedAt: sib.validatedAt ?? now,
              };
            } else {
              next[sib.id] = {
                ...sib,
                status: 'superseded',
                supersededAt: now,
                supersededBy: id,
              };
            }
          }

          return { deliverables: next };
        }),

      updateDeliverable: (id, patch) =>
        set((s) => {
          const existing = s.deliverables[id];
          if (!existing) return s;
          return {
            deliverables: {
              ...s.deliverables,
              [id]: { ...existing, ...patch },
            },
          };
        }),

      hydrate: (rows, ventureId) => {
        hydratingFromDb = true;
        try {
          set((s) => {
            const next = { ...s.deliverables };
            let changed = false;
            for (const d of rows) {
              if (!next[d.id]) {
                next[d.id] = d;
                changed = true;
              }
            }
            if (s.activeVentureId !== ventureId || changed) {
              return {
                deliverables: changed ? next : s.deliverables,
                activeVentureId: ventureId,
              };
            }
            return s;
          });
        } finally {
          hydratingFromDb = false;
        }
      },

      setActiveVentureId: (id) => set({ activeVentureId: id }),
    }),
    {
      name: 'iv-deliverables-store',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted: any, version) => {
        if (version < 3) {
          return { deliverables: {} };
        }
        return persisted;
      },
    }
  )
);

/* ---------- Selectors ---------- */

import { useMemo } from 'react';

export function useLatestDeliverable(
  pageId: string,
  opId: string
): Deliverable | undefined {
  const deliverables = useDeliverablesStore((s) => s.deliverables);
  const activeVentureId = useDeliverablesStore((s) => s.activeVentureId);
  return useMemo(() => {
    const siblings = Object.values(deliverables).filter(
      (d) =>
        d.pageId === pageId &&
        d.opId === opId &&
        (!activeVentureId || d.ventureId === activeVentureId)
    );
    if (siblings.length === 0) return undefined;

    /* Prefer the validated (active) version. Only when no
       version is validated do we fall back to the newest. This
       is what makes Set active actually change what the ops
       card shows — otherwise activating v1 would leave the
       card pointing at the still-newest-but-superseded v2. */
    const active = siblings.find((d) => d.status === 'validated');
    if (active) return active;

    return siblings.sort((a, b) => b.version - a.version)[0];
  }, [deliverables, activeVentureId, pageId, opId]);
}

export function usePageDeliverables(pageId: string): Deliverable[] {
  const deliverables = useDeliverablesStore((s) => s.deliverables);
  const activeVentureId = useDeliverablesStore((s) => s.activeVentureId);
  return useMemo(
    () =>
      Object.values(deliverables)
        .filter(
          (d) =>
            d.pageId === pageId &&
            d.status === 'validated' &&
            (!activeVentureId || d.ventureId === activeVentureId)
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [deliverables, activeVentureId, pageId]
  );
}

export function useSupersededDeliverables(ventureId?: string): Deliverable[] {
  const deliverables = useDeliverablesStore((s) => s.deliverables);
  const activeVentureId = useDeliverablesStore((s) => s.activeVentureId);
  const scope = ventureId ?? activeVentureId ?? undefined;
  return useMemo(
    () =>
      Object.values(deliverables)
        .filter(
          (d) =>
            d.status === 'superseded' &&
            (!scope || d.ventureId === scope)
        )
        .sort((a, b) =>
          (b.supersededAt ?? '').localeCompare(a.supersededAt ?? '')
        ),
    [deliverables, scope]
  );
}

/* ============================================================
   Persistence subscription — the sidecar.

   Fires three passes per store update, in submission order:

     1. New ids          → flushDeliverable
     2. Superseded ids   → flushSupersede
     3. Removed ids      → flushDelete

   Both flushes go through `enqueue` in persistence.ts — a
   single module-level Promise chain. This means the network
   calls themselves execute strictly in submission order:

       v2.insert  →  v1.supersede  →  (any deletes)

   The `superseded_by` FK is satisfied because v2 exists in
   Postgres before v1 points at it.

   The subscription itself stays synchronous — Zustand requires
   it. `enqueue` handles the ordering internally.
   ============================================================ */
let deliverablesPersistenceInstalled = false;

export function installDeliverablesPersistence(): void {
  if (deliverablesPersistenceInstalled) return;
  deliverablesPersistenceInstalled = true;

  useDeliverablesStore.subscribe((state, prev) => {
    if (hydratingFromDb) return;

    /* Pass 1 — new ids (queued first) */
    for (const [id, d] of Object.entries(state.deliverables)) {
      if (!prev.deliverables[id]) {
        void flushDeliverable(d);
      }
    }

    /* Pass 2 — superseded transitions (queued after all inserts) */
    for (const [id, d] of Object.entries(state.deliverables)) {
      const p = prev.deliverables[id];
      if (p && p.status !== 'superseded' && d.status === 'superseded') {
        void flushSupersede(d.id, d.supersededBy);
      }
    }

    /* Pass 3 — deletes (queued last) */
    for (const id of Object.keys(prev.deliverables)) {
      if (!state.deliverables[id]) {
        void flushDelete(id);
      }
    }
  });
}

installDeliverablesPersistence();
