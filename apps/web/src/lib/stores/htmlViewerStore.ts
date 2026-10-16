import { create } from 'zustand';

/**
 * htmlViewerStore — the modal that renders a self-contained HTML
 * deliverable in an iframe, regardless of share-link state.
 *
 * Used by useOpenDeliverable when an HTML deliverable exists but
 * either has no share link yet, or the share link can't be resolved.
 */
interface HtmlViewerState {
  open: boolean;
  html: string | null;
  title: string | null;
  deliverableId: string | null;

  openHtml: (input: {
    html: string;
    title: string;
    deliverableId?: string;
  }) => void;
  close: () => void;
}

export const useHtmlViewer = create<HtmlViewerState>((set) => ({
  open: false,
  html: null,
  title: null,
  deliverableId: null,

  openHtml: ({ html, title, deliverableId }) =>
    set({
      open: true,
      html,
      title,
      deliverableId: deliverableId ?? null,
    }),

  close: () =>
    set({
      open: false,
      html: null,
      title: null,
      deliverableId: null,
    }),
}));
