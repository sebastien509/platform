import { create } from 'zustand';
import type { VentureDocument } from '@/lib/types';

interface DocumentViewerState {
  open: boolean;
  docId: string | null;
  /** When set, the drawer renders this document directly instead of
   *  looking up a store id. Used for op outputs that aren't yet
   *  registered as VentureDocuments. */
  inlineDoc: VentureDocument | null;

  openDocument: (id: string) => void;
  openInline: (doc: VentureDocument) => void;
  close: () => void;
}

export const useDocumentViewer = create<DocumentViewerState>((set) => ({
  open: false,
  docId: null,
  inlineDoc: null,

  openDocument: (id) =>
    set({ open: true, docId: id, inlineDoc: null }),

  openInline: (doc) =>
    set({ open: true, docId: doc.id, inlineDoc: doc }),

  close: () => set({ open: false, docId: null, inlineDoc: null }),
}));
