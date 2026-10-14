import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createEmptyJourney } from '@/lib/factories/createIdeaJourney';
import type { Idea, IdeaJourney } from '@/lib/types';

/* ============================================================
   Persistence config
   ============================================================ */

const STORAGE_KEY = 'iv-journey-store';
/** Bump this when IdeaJourney or Idea shapes change incompatibly. */
const STORAGE_VERSION = 2;

const INITIAL_JOURNEYS: Record<string, IdeaJourney> = {};
const INITIAL_IDEAS: Idea[] = [];

/* ============================================================
   Store
   ============================================================ */

interface JourneyStore {
  journeys: Record<string, IdeaJourney>;
  ideas: Idea[];
  /** Write-through — persists the journey AND auto-graduates the idea. */
  setJourney: (id: string, journey: IdeaJourney) => void;
  /** Get or create. Fresh journeys start at Capture. */
  ensureJourney: (id: string) => IdeaJourney;
  /** Reset to mock seeds. Persisted state overwrites to match. */
  reset: () => void;
}

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set, get) => ({
      journeys: INITIAL_JOURNEYS,
      ideas: INITIAL_IDEAS,

      ensureJourney: (id) => {
        const existing = get().journeys[id];
        if (existing) return existing;
        const fresh = createEmptyJourney(id);
        set((s) => ({ journeys: { ...s.journeys, [id]: fresh } }));
        return fresh;
      },

      setJourney: (id, journey) => {
        set((s) => ({ journeys: { ...s.journeys, [id]: journey } }));

        const isSynthesized = journey.stageStates.synthesize === 'complete';
        const isGraduated = !!journey.createdVentureId;

        /* Synthesize complete → idea enters the graduated list.
           Venture created → idea marked validated. */
        if (isSynthesized && !get().ideas.find((i) => i.id === id)) {
          const newIdea: Idea = {
            id,
            title:
              journey.structured.value?.value?.slice(0, 80) || 'Untitled idea',
            description: journey.structured.problem?.value || '',
            problem: journey.structured.problem?.value || '',
            hypothesis: journey.structured.value?.value || '',
            audience: journey.structured.persona?.value || '',
            phase: (isGraduated ? 'shipped' : 'validate') as unknown as Idea['phase'],
            status: (isGraduated ? 'validated' : 'validating') as unknown as Idea['status'],
            owner: 'You',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: isGraduated ? 100 : 85,
            context: {
              evidence: [],
              knowledge: [],
              artifacts: [],
              checkpoints: [],
            },
          };
          set((s) => ({ ideas: [newIdea, ...s.ideas] }));
        } else if (isGraduated) {
          set((s) => ({
            ideas: s.ideas.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: 'validated' as unknown as Idea['status'],
                    phase: 'shipped' as unknown as Idea['phase'],
                    progress: 100,
                    updatedAt: new Date().toISOString(),
                  }
                : i
            ),
          }));
        }
      },

      reset: () =>
        set({
          journeys: INITIAL_JOURNEYS,
          ideas: INITIAL_IDEAS,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),

      /* Only persist user-mutable state, not the store functions */
      partialize: (state) => ({
        journeys: state.journeys,
        ideas: state.ideas,
      }),

      /* Merge persisted state with current mock seeds — so new seeds
         added to mock data later still appear even if the user has
         persisted state from an older version. */
      merge: (persisted: any, current: JourneyStore): JourneyStore => {
        if (!persisted || typeof persisted !== 'object') return current;
        return {
          ...current,
          journeys: persisted.journeys ?? {},
          ideas: persisted.ideas ?? [],
        };
      },

      migrate: (persisted: any, version: number) => {
        if (version !== STORAGE_VERSION) {
          return { journeys: {}, ideas: [] };
        }
        return persisted;
      },

    }
  )
);

/** Exported for pages that need to check if an id is a known seed. */

/** Dev helper — call from console to clear persisted state.
 *  Example: `import { clearPersistedState } from '@/lib/stores/journeyStore'; clearPersistedState();`
 *  Or just delete the `iv-journey-store` key in DevTools → Application → Local Storage. */
export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable — no-op */
  }
}
