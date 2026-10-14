import { create } from 'zustand';

export interface InteractionStore {
  activeInteraction: string | null;
  interactions: Record<string, {
    steps: Array<{
      id: string;
      prompt: string;
      type: 'input' | 'decision' | 'result' | 'next';
      completed: boolean;
      data?: Record<string, unknown>;
    }>;
    currentStep: number;
    completed: boolean;
    result?: unknown;
  }>;
  setActiveInteraction: (id: string | null) => void;
  addStep: (interactionId: string, step: { prompt: string; type: 'input' | 'decision' | 'result' | 'next' }) => void;
  completeStep: (interactionId: string, data?: Record<string, unknown>) => void;
  completeInteraction: (interactionId: string, result?: unknown) => void;
  getInteraction: (id: string) => InteractionStore['interactions'][string] | undefined;
}

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  activeInteraction: null,
  interactions: {},

  setActiveInteraction: (id) => set({ activeInteraction: id }),

  addStep: (interactionId, step) => {
    set((state) => {
      const current = state.interactions[interactionId] || {
        steps: [],
        currentStep: 0,
        completed: false,
      };
      return {
        interactions: {
          ...state.interactions,
          [interactionId]: {
            ...current,
            steps: [
              ...current.steps,
              {
                id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                ...step,
                completed: false,
              },
            ],
          },
        },
      };
    });
  },

  completeStep: (interactionId, data) => {
    set((state) => {
      const current = state.interactions[interactionId];
      if (!current) return state;
      const steps = [...current.steps];
      if (steps[current.currentStep]) {
        steps[current.currentStep] = {
          ...steps[current.currentStep],
          completed: true,
          data,
        };
      }
      return {
        interactions: {
          ...state.interactions,
          [interactionId]: {
            ...current,
            steps,
            currentStep: Math.min(current.currentStep + 1, steps.length),
          },
        },
      };
    });
  },

  completeInteraction: (interactionId, result) => {
    set((state) => ({
      interactions: {
        ...state.interactions,
        [interactionId]: {
          ...state.interactions[interactionId],
          completed: true,
          result,
        },
      },
      activeInteraction: state.activeInteraction === interactionId ? null : state.activeInteraction,
    }));
  },

  getInteraction: (id) => {
    return get().interactions[id];
  },
}));
