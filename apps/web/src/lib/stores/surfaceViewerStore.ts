import { create } from 'zustand';

export type SurfaceFormat = 'html' | 'pdf' | 'deck';

export type SurfaceMode =
  /** Browsing a validated or shared artifact. */
  | 'browse'
  /** Live run produced this surface — founder can validate or improve. */
  | 'active'
  /** Already validated and saved as a deliverable. */
  | 'validated';

interface SurfaceViewerState {
  openLinkId: string | null;
  /** Which run produced it, if any. */
  runId: string | null;
  /** Which deliverable it maps to, if already validated. */
  deliverableId: string | null;
  /** Export format being viewed. */
  format: SurfaceFormat;

  /** Open a surface for browsing (share link, past artifact). */
  open: (linkId: string, opts?: { deliverableId?: string }) => void;
  /** Open a surface tied to a live run — shows Validate/Improve. */
  openFromRun: (linkId: string, runId: string) => void;

  setFormat: (format: SurfaceFormat) => void;
  close: () => void;
}

export const useSurfaceViewer = create<SurfaceViewerState>((set) => ({
  openLinkId: null,
  runId: null,
  deliverableId: null,
  format: 'html',

  open: (linkId, opts) =>
    set({
      openLinkId: linkId,
      runId: null,
      deliverableId: opts?.deliverableId ?? null,
      format: 'html',
    }),

  openFromRun: (linkId, runId) =>
    set({
      openLinkId: linkId,
      runId,
      deliverableId: null,
      format: 'html',
    }),

  setFormat: (format) => set({ format }),

  close: () =>
    set({
      openLinkId: null,
      runId: null,
      deliverableId: null,
      format: 'html',
    }),
}));
