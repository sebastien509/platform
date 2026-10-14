import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ventures as seedVentures } from '@/data/mockData';
import type {
  Venture,
  VentureDocument,
  VenturePageFunnel,
  OutcomeEntry,
} from '@/lib/types';

const STORAGE_KEY = 'iv-venture-store';
const STORAGE_VERSION = 1;

const INITIAL_VENTURES: Venture[] = [...seedVentures];

interface VentureStore {
  ventures: Venture[];
  /** Executed action records — the venture's outcome ledger. */
  outcomes: Record<string, OutcomeEntry>;
  addOutcome: (o: OutcomeEntry) => void;
  /** Documents per venture, keyed by document id. */
  documents: Record<string, VentureDocument>;
  addVenture: (v: Venture) => void;
  updateVenture: (id: string, patch: Partial<Venture>) => void;
  getVenture: (id: string) => Venture | undefined;
  /** Get all docs for a venture, sorted by page then kind. */
  documentsFor: (ventureId: string) => VentureDocument[];
  /** Get headline docs for a venture. */
  headlineDocsFor: (ventureId: string) => VentureDocument[];
  /** Add or replace a document. */
  upsertDocument: (doc: VentureDocument) => void;
  /** Approve a document (status: approved, approvedAt timestamp). */
  approveDocument: (docId: string) => void;
  /** Mark a document as needing revision with an optional note. */
  requestRevision: (docId: string, note?: string) => void;
  /** Funnel state per venture per page. Key: `${ventureId}:${pageKey}`. */
  funnelStates: Record<string, VenturePageFunnel>;
  getFunnel: (ventureId: string, pageKey: string) => VenturePageFunnel | undefined;
  setFunnel: (ventureId: string, pageKey: string, state: VenturePageFunnel) => void;
  reset: () => void;
}

export const useVentureStore = create<VentureStore>()(
  persist(
    (set, get) => ({
      ventures: INITIAL_VENTURES,
      outcomes: {},

      addOutcome: (o) =>
        set((s) => ({
          outcomes: { ...s.outcomes, [o.id]: o },
        })),
      documents: {},
      funnelStates: {},

      addVenture: (v) => {
        const existing = get().ventures.find((x) => x.id === v.id);
        if (existing) {
          /* Replace rather than duplicate if the id already exists */
          set((s) => ({
            ventures: s.ventures.map((x) => (x.id === v.id ? v : x)),
          }));
        } else {
          set((s) => ({ ventures: [v, ...s.ventures] }));
        }
      },

      updateVenture: (id, patch) =>
        set((s) => ({
          ventures: s.ventures.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v
          ),
        })),

      getVenture: (id) => get().ventures.find((v) => v.id === id),

      documentsFor: (ventureId) =>
        Object.values(get().documents).filter((d) => d.ventureId === ventureId),

      headlineDocsFor: (ventureId) =>
        Object.values(get().documents).filter(
          (d) => d.ventureId === ventureId && d.isHeadline
        ),

      upsertDocument: (doc) =>
        set((s) => ({
          documents: { ...s.documents, [doc.id]: doc },
        })),

      approveDocument: (docId) =>
        set((s) => {
          const existing = s.documents[docId];
          if (!existing) return s;
          return {
            documents: {
              ...s.documents,
              [docId]: {
                ...existing,
                status: 'approved',
                approvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                revisionNote: undefined,
              },
            },
          };
        }),

      requestRevision: (docId, note) =>
        set((s) => {
          const existing = s.documents[docId];
          if (!existing) return s;
          return {
            documents: {
              ...s.documents,
              [docId]: {
                ...existing,
                status: 'needs_revision',
                revisionNote: note,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      getFunnel: (ventureId, pageKey) =>
        get().funnelStates[`${ventureId}:${pageKey}`],

      setFunnel: (ventureId, pageKey, state) =>
        set((s) => ({
          funnelStates: { ...s.funnelStates, [`${ventureId}:${pageKey}`]: state },
        })),

      reset: () =>
        set({
          ventures: INITIAL_VENTURES,
          documents: {},
          funnelStates: {},
          outcomes: {},
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ventures: state.ventures,
        documents: state.documents,
        funnelStates: state.funnelStates,
        outcomes: state.outcomes,
      }),
      merge: (persisted: any, current: VentureStore): VentureStore => {
        if (!persisted || typeof persisted !== 'object') return current;
        const persistedVentures: Venture[] = persisted.ventures ?? [];
        const seedIds = new Set(INITIAL_VENTURES.map((v) => v.id));
        const userVentures = persistedVentures.filter((v) => !seedIds.has(v.id));
        return {
          ...current,
          ventures: [...INITIAL_VENTURES, ...userVentures],
          documents: persisted.documents ?? {},
          outcomes: persisted.outcomes ?? {},
          funnelStates: persisted.funnelStates ?? {},
        };
      },
      migrate: (persisted: any, version) => {
        if (version !== STORAGE_VERSION) {
          return { ventures: INITIAL_VENTURES, documents: {}, funnelStates: {} };
        }
        return persisted;
      },
    }
  )
);
