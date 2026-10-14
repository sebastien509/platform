import { create } from 'zustand';

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'decision';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  ventureId?: string;
  /** Source page this notification came from — clicking navigates here. */
  href?: string;
  /** Human label for the source (venture name, agent name, etc.). */
  sourceLabel?: string;
  /** Runtime state:
   *   queued  — in the stack, awaiting view
   *   visible — currently rendered as a toast
   *   dimmed  — auto-dismissed from stack, still in history
   *   read    — user has seen/clicked it
   */
  state: 'queued' | 'visible' | 'dimmed' | 'read';
}

interface NotificationState {
  notifications: AppNotification[];
  sidebarOpen: boolean;

  push: (n: Omit<AppNotification, 'state'>) => void;
  pushMany: (list: Array<Omit<AppNotification, 'state'>>) => void;
  /** Replace the notifications array with a fresh set from the DB.
   *  Called by NotificationsProvider after each fetch. */
  hydrate: (rows: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dim: (id: string) => void;
  clearAll: () => void;

  remove: (id: string) => void;
  removeRead: () => void;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  sidebarOpen: false,

  push: (n) =>
    set((s) => ({
      notifications: [
        { ...n, state: 'queued' } as AppNotification,
        ...s.notifications,
      ].slice(0, 200),
    })),

  hydrate: (rows) => set({ notifications: rows.slice(0, 200) }),

  pushMany: (list) =>
    set((s) => ({
      notifications: [
        ...list.map(
          (n): AppNotification => ({ ...n, state: 'queued' })
        ),
        ...s.notifications,
      ].slice(0, 200),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, state: 'read' } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, state: 'read' })),
    })),

  dim: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id && n.state !== 'read' ? { ...n, state: 'dimmed' } : n
      ),
    })),

  clearAll: () => set({ notifications: [] }),

  remove: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  removeRead: () =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.state !== 'read'),
    })),

  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

/** Convenience selectors. */
export const useUnreadCount = () =>
  useNotificationStore((s) => s.notifications.filter((n) => n.state !== 'read').length);