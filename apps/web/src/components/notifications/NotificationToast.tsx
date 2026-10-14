import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import { UI } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import type { AppNotification, NotificationType } from '@/lib/stores/notificationStore';

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

interface NotificationToastProps {
  notification: AppNotification;
  onClick: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function NotificationToast({
  notification,
  onClick,
  onDismiss,
}: NotificationToastProps) {
  const [dimmed, setDimmed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.Icon;

  /* Dim after N seconds — user gets a visual cue it's about to go. */
  useEffect(() => {
    const t = setTimeout(() => setDimmed(true), UI.NOTIFICATION_OPACITY_DIM_MS);
    return () => clearTimeout(t);
  }, []);

  /* Auto-dismiss after full window — paused while hovered. */
  useEffect(() => {
    if (hovered) return;
    const t = setTimeout(
      () => onDismiss(notification.id),
      UI.NOTIFICATION_AUTO_DISMISS_MS
    );
    return () => clearTimeout(t);
  }, [hovered, notification.id, onDismiss]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'pointer-events-auto group relative w-80 rounded-lg border border-[var(--border)]',
        'bg-[var(--surface-1)] shadow-[var(--elevation-floating)]',
        'transition-opacity duration-300',
        dimmed && !hovered ? 'opacity-70' : 'opacity-100'
      )}
    >
      <button
        type="button"
        onClick={() => onClick(notification.id)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <span className={cn('mt-0.5 shrink-0', config.className)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            {notification.title}
          </p>
          {notification.description && (
            <p className="mt-0.5 text-2xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {notification.description}
            </p>
          )}
          {notification.agentName && (
            <p className="mt-1 text-2xs text-[var(--text-muted)]">
              {notification.agentName}
            </p>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        aria-label="Dismiss notification"
        className={cn(
          'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md',
          'text-[var(--text-muted)] opacity-0 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
          'group-hover:opacity-100 transition-opacity'
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
