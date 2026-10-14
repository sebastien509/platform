import { create } from 'zustand';

interface LoadingState {
  /** True while the app is doing its first bootstrap — blocks everything. */
  bootReady: boolean;
  /** Number of concurrent locks requesting a full-screen block. */
  lockCount: number;
  /** Message shown in the loading screen when it's locked. */
  message: string;

  setBootReady: (v: boolean) => void;
  /** Locks the platform with a specific message. Returns unlock. */
  lock: (message?: string) => () => void;
  /** Clears all locks. Use with care. */
  clearLocks: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  bootReady: false,
  lockCount: 0,
  message: 'Getting things ready',

  setBootReady: (v) => set({ bootReady: v }),

  lock: (message = 'Getting things ready') => {
    set((s) => ({ lockCount: s.lockCount + 1, message }));
    let released = false;
    return () => {
      if (released) return;
      released = true;
      set((s) => ({ lockCount: Math.max(0, s.lockCount - 1) }));
    };
  },

  clearLocks: () => set({ lockCount: 0 }),
}));

export const useLoadingVisible = () =>
  useLoadingStore((s) => !s.bootReady || s.lockCount > 0);