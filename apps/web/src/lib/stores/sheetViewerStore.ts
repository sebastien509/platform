import { create } from 'zustand';

export interface SheetTab {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
}

interface SheetViewerState {
  open: boolean;
  tabs: SheetTab[];
  title: string | null;
  deliverableId: string | null;
  activeTab: number;

  openSheet: (input: {
    tabs: SheetTab[];
    title: string;
    deliverableId?: string;
  }) => void;
  close: () => void;
  setTab: (index: number) => void;
}

export const useSheetViewer = create<SheetViewerState>((set) => ({
  open: false,
  tabs: [],
  title: null,
  deliverableId: null,
  activeTab: 0,

  openSheet: ({ tabs, title, deliverableId }) =>
    set({
      open: true,
      tabs,
      title,
      deliverableId: deliverableId ?? null,
      activeTab: 0,
    }),

  close: () =>
    set({ open: false, tabs: [], title: null, deliverableId: null, activeTab: 0 }),

  setTab: (index) => {
    set((s) => ({
      activeTab: index >= 0 && index < s.tabs.length ? index : s.activeTab,
    }));
  },
}));
