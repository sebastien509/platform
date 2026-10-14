import { create } from 'zustand';

interface ArtifactEditorStore {
  open: boolean;
  docId: string | null;
  /** Which tab is active inside the drawer. */
  mode: 'inspect' | 'edit';
  openEditor: (id: string, mode?: 'inspect' | 'edit') => void;
  setMode: (mode: 'inspect' | 'edit') => void;
  close: () => void;
}

export const useArtifactEditor = create<ArtifactEditorStore>((set) => ({
  open: false,
  docId: null,
  mode: 'inspect',
  openEditor: (id, mode = 'inspect') => set({ open: true, docId: id, mode }),
  setMode: (mode) => set({ mode }),
  close: () => set({ open: false }),
}));
