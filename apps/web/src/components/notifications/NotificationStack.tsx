import { useNotificationStore, useUnreadCount } from '@/lib/stores/notificationStore';
import { UI } from '@/lib/stores/uiStore';
import { NotificationToast } from './NotificationToast';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function NotificationStack() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const dim = useNotificationStore((s) => s.dim);
  const openSidebar = useNotificationStore((s) => s.openSidebar);
  const totalUnread = useUnreadCount();

  /* Only show queued/visible — dimmed and read are history-only. */
  const active = notifications.filter(
    (n) => n.state === 'queued' || n.state === 'visible'
  );
  const visible = active.slice(0, UI.NOTIFICATION_MAX_VISIBLE);
  const overflow = active.length - visible.length;

  if (visible.length === 0 && totalUnread === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-4 top-20 z-30 flex flex-col gap-2',
        'w-80'
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      {visible.map((n) => (
        <NotificationToast
          key={n.id}
          notification={n}
          onClick={(id) => {
            markRead(id);
            openSidebar();
          }}
          onDismiss={dim}
        />
      ))}

      {overflow > 0 && (
        <button
          type="button"
          onClick={openSidebar}
          className={cn(
            'pointer-events-auto self-end rounded-full',
            'bg-[var(--surface-2)] border border-[var(--border)]',
            'px-3 py-1 text-2xs font-medium text-[var(--text-secondary)]',
            'hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]',
            'transition-colors inline-flex items-center gap-1'
          )}
        >
          <ChevronDown className="h-3 w-3" />
          +{overflow} more
        </button>
      )}
    </div>
  );
}
