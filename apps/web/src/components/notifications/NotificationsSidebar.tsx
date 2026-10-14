import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useNotificationStore,
  type AppNotification,
  type NotificationType,
} from '@/lib/stores/notificationStore';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDismissAllNotifications,
} from '@/lib/hooks/useNotifications';
import { DrawerShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const TYPE_CONFIG: Record<
  NotificationType,
  { Icon: typeof CheckCircle2; className: string }
> = {
  success: { Icon: CheckCircle2, className: 'text-[var(--success)]' },
  error: { Icon: XCircle, className: 'text-[var(--error)]' },
  warning: { Icon: AlertTriangle, className: 'text-[var(--warning)]' },
  info: { Icon: Info, className: 'text-[var(--info)]' },
  decision: { Icon: Sparkles, className: 'text-[var(--accent)]' },
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsSidebar() {
  const navigate = useNavigate();

  const open = useNotificationStore((s) => s.sidebarOpen);
  const close = useNotificationStore((s) => s.closeSidebar);
  const notifications = useNotificationStore((s) => s.notifications);
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const storeClearAll = useNotificationStore((s) => s.clearAll);
  const storeMarkRead = useNotificationStore((s) => s.markRead);

  /* DB mutations — these are the source of truth. */
  const markAllReadDb = useMarkAllNotificationsRead();
  const markOneReadDb = useMarkNotificationRead();
  const dismissAllDb = useDismissAllNotifications();

  const hasUnread = notifications.some((n) => n.state !== 'read');

  function handleMarkAllRead() {
    /* Optimistic local update + persistent DB write. */
    storeMarkAllRead();
    markAllReadDb.mutate();
  }

  function handleClearAll() {
    /* Optimistic local clear + persistent dismiss for every row. */
    storeClearAll();
    dismissAllDb.mutate();
  }

  function handleOpenNotification(n: AppNotification) {
    storeMarkRead(n.id);
    markOneReadDb.mutate(n.id);
    if (n.href) {
      navigate(n.href);
      close();
    }
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Notifications"
      description="Everything the platform has surfaced recently."
      side="right"
      width={400}
    >
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={!hasUnread || markAllReadDb.isPending}
          >
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={notifications.length === 0 || dismissAllDb.isPending}
            className="text-[var(--error)] hover:text-[var(--error)]"
          >
            Clear all
          </Button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onOpen={() => handleOpenNotification(n)}
              />
            ))}
          </ul>
        )}
      </div>
    </DrawerShell>
  );
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: () => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.Icon;
  const isUnread = notification.state !== 'read';
  const clickable = Boolean(notification.href);

  return (
    <li
      onClick={clickable ? onOpen : undefined}
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors',
        clickable && 'cursor-pointer',
        isUnread
          ? 'bg-[var(--surface-2)]'
          : 'bg-transparent hover:bg-[var(--surface-2)]',
      )}
    >
      <span className={cn('mt-0.5 shrink-0', config.className)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            {notification.title}
          </p>
          {isUnread && (
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          )}
        </div>
        {notification.description && (
          <p className="mt-0.5 text-2xs text-[var(--text-secondary)] leading-relaxed">
            {notification.description}
          </p>
        )}
        <p className="mt-1 text-2xs text-[var(--text-muted)]">
          {notification.agentName ? `${notification.agentName} · ` : ''}
          {formatRelative(notification.timestamp)}
        </p>
      </div>
    </li>
  );
}
