import { create } from 'zustand';

/* ============================================================
   commentPanelStore — the global controller for the founder's
   comments panel. One instance mounted at the app level; any
   deliverable card can trigger it via open(outputId).
   ============================================================ */

interface CommentPanelState {
  open: boolean;
  outputId: string | null;
  /** Deliverable title + pageId passed for header display. */
  context: {
    title: string;
    pageId: string;
    ventureId?: string;
    shareLinkId?: string;
  } | null;
  openPanel: (input: {
    outputId: string;
    title: string;
    pageId: string;
    ventureId?: string;
    shareLinkId?: string;
  }) => void;
  closePanel: () => void;
}

export const useCommentPanelStore = create<CommentPanelState>((set) => ({
  open: false,
  outputId: null,
  context: null,

  openPanel: (input) =>
    set({
      open: true,
      outputId: input.outputId,
      context: {
        title: input.title,
        pageId: input.pageId,
        ventureId: input.ventureId,
        shareLinkId: input.shareLinkId,
      },
    }),

  closePanel: () =>
    set({
      open: false,
      outputId: null,
      context: null,
    }),
}));
