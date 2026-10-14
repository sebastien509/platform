import { create } from 'zustand';

/* ============================================================
   UI CONSTANTS — single source of truth for shell dimensions,
   opacities, and timings. Change here, changes everywhere.
   ============================================================ */
export const UI = {
  /* Global sidebar */
  GLOBAL_SIDEBAR_WIDTH_EXPANDED: 240,
  GLOBAL_SIDEBAR_WIDTH_COLLAPSED: 56,
  GLOBAL_SIDEBAR_COLLAPSED_ICON_OPACITY: 'opacity-60', // opacity-50 | opacity-60 | opacity-70

  /* Venture sidebar */
  VENTURE_SIDEBAR_WIDTH_EXPANDED: 176,
  VENTURE_SIDEBAR_WIDTH_COLLAPSED: 48,

  /* Transition */
  SIDEBAR_TRANSITION_MS: 200,
  SIDEBAR_TRANSITION_EASE: 'ease-out',

  /* Notifications */
  NOTIFICATION_MAX_VISIBLE: 3,
  NOTIFICATION_AUTO_DISMISS_MS: 5500,
  NOTIFICATION_OPACITY_DIM_MS: 3000,
  NOTIFICATION_FADE_TO_MS: 10000,

  /* Agent monitoring */
  MONITORING_STRIP_COLLAPSED_HEIGHT: 44,
  MONITORING_STRIP_EXPANDED_HEIGHT: 200,
  MONITORING_VISIBLE_AGENTS: 3,
  MONITORING_ROTATE_INTERVAL_MS: 8000,
} as const;

/* ============================================================
   STORE
   ============================================================ */
interface UIState {
  /* ---- Global sidebar ---- */
  sidebarCollapsed: boolean;
  ventureAutoCollapse: boolean;

  /* ---- Venture sidebar ---- */
  ventureSidebarCollapsed: boolean;

  /* ---- Other UI ---- */
  quickAddOpen: boolean;
  activeModal: string | null;
  pendingCheckpointCount: number;

  /* ---- Actions ---- */
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setVentureAutoCollapse: (value: boolean) => void;
  expandSidebar: () => void;

  toggleVentureSidebar: () => void;
  setVentureSidebarCollapsed: (collapsed: boolean) => void;

  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  setActiveModal: (modal: string | null) => void;
  setPendingCheckpointCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  ventureAutoCollapse: false,
  ventureSidebarCollapsed: false,

  quickAddOpen: false,
  activeModal: null,
  pendingCheckpointCount: 0,

  toggleSidebar: () => {
    const s = get();
    const effective = s.sidebarCollapsed || s.ventureAutoCollapse;
    if (effective) {
      set({ sidebarCollapsed: false, ventureAutoCollapse: false });
    } else {
      set({ sidebarCollapsed: true });
    }
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setVentureAutoCollapse: (value) => set({ ventureAutoCollapse: value }),
  expandSidebar: () => set({ sidebarCollapsed: false, ventureAutoCollapse: false }),

  toggleVentureSidebar: () =>
    set((s) => ({ ventureSidebarCollapsed: !s.ventureSidebarCollapsed })),
  setVentureSidebarCollapsed: (collapsed) =>
    set({ ventureSidebarCollapsed: collapsed }),

  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setPendingCheckpointCount: (count) => set({ pendingCheckpointCount: count }),
}));

export const useEffectiveSidebarCollapsed = () =>
  useUIStore((s) => s.sidebarCollapsed || s.ventureAutoCollapse);
