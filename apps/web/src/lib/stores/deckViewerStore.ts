import { create } from 'zustand';

export interface DeckSlide {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  bullets?: string[] | null;
  metric?: { label: string; value: string } | null;
}

interface DeckViewerState {
  open: boolean;
  slides: DeckSlide[];
  title: string | null;
  deliverableId: string | null;
  currentIndex: number;

  openDeck: (input: {
    slides: DeckSlide[];
    title: string;
    deliverableId?: string;
  }) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export const useDeckViewer = create<DeckViewerState>((set, get) => ({
  open: false,
  slides: [],
  title: null,
  deliverableId: null,
  currentIndex: 0,

  openDeck: ({ slides, title, deliverableId }) =>
    set({
      open: true,
      slides,
      title,
      deliverableId: deliverableId ?? null,
      currentIndex: 0,
    }),

  close: () =>
    set({ open: false, slides: [], title: null, deliverableId: null, currentIndex: 0 }),

  next: () => {
    const { currentIndex, slides } = get();
    if (currentIndex < slides.length - 1) set({ currentIndex: currentIndex + 1 });
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },

  goTo: (index) => {
    const { slides } = get();
    if (index >= 0 && index < slides.length) set({ currentIndex: index });
  },
}));
