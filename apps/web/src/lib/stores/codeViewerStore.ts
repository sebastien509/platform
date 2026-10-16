import { create } from 'zustand';

interface CodeViewerState {
  open: boolean;
  language: string | null;
  code: string | null;
  label: string | null;
  deliverableId: string | null;

  openCode: (input: {
    language?: string | null;
    code: string;
    label?: string | null;
    deliverableId?: string;
  }) => void;
  close: () => void;
}

export const useCodeViewer = create<CodeViewerState>((set) => ({
  open: false,
  language: null,
  code: null,
  label: null,
  deliverableId: null,

  openCode: ({ language, code, label, deliverableId }) =>
    set({
      open: true,
      language: language ?? null,
      code,
      label: label ?? null,
      deliverableId: deliverableId ?? null,
    }),

  close: () =>
    set({ open: false, language: null, code: null, label: null, deliverableId: null }),
}));
