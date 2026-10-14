import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { formatNotification } from './formatNotification';
import {
  useNotifications,
  type DbNotification,
} from '@/lib/hooks/useNotifications';

/**
 * Map a DB notification row into the client-side AppNotification shape.
 */
function rowToNotification(row: DbNotification) {
  const formatted = formatNotification({
    meta: (row as any).meta ?? null,
    title: row.title,
    description: row.description,
    actor_name: row.actor_name,
    icon_type: row.icon_type,
    venture_id: (row as any).venture_id ?? null,
    href: row.href,
  });

  return {
    id: row.id,
    type: formatted.icon_type,
    title: formatted.title,
    description: formatted.description,
    timestamp: row.created_at,
    href: formatted.href ?? undefined,
    sourceLabel: row.source_label ?? undefined,
    agentName: row.actor_name ?? undefined,
    state: row.read_at ? ('read' as const) : ('queued' as const),
  };
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const { data: rows, isSuccess } = useNotifications();
  const hydrate = useNotificationStore((s) => s.hydrate);
  const clearAll = useNotificationStore((s) => s.clearAll);

  /* Wipe the store once on mount — any placeholder / legacy
   * seed data gets cleared before the first DB sync lands. */
  const clearedRef = useRef(false);
  useEffect(() => {
    if (clearedRef.current) return;
    clearedRef.current = true;
    clearAll();
  }, [clearAll]);

  /* ── DB → store sync ──
   * Only hydrate once the query has settled. That way an empty
   * result set is unambiguous: it clears the store rather than
   * leaving stale data behind. */
  useEffect(() => {
    if (!isSuccess) return;
    hydrate((rows ?? []).map(rowToNotification));
  }, [rows, isSuccess, hydrate]);

  /* ── Realtime subscription ── */
  useEffect(() => {
    const channel = supabase
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          qc.invalidateQueries({ queryKey: ['notifications'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return <>{children}</>;
}
