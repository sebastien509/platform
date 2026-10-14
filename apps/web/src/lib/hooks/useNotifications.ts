import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DbNotification {
  id: string;
  user_id: string;
  event_id: string;
  event_type: string;
  title: string;
  description: string | null;
  href: string | null;
  actor_name: string | null;
  source_label: string | null;
  icon_type: 'success' | 'error' | 'warning' | 'info' | 'decision';
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  /** Structured event payload — the source of truth for copy. */
  meta: Record<string, any> | null;
  /** Denormalized for routing — the venture this event belongs to. */
  venture_id?: string | null;
}

/* ============================================================
   Reads
   ============================================================ */

export function useNotifications(limit = 100) {
  return useQuery<DbNotification[]>({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*, event:event_id(venture_id)')
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      /* Flatten the joined venture_id onto the row so downstream
       * code (formatter, routing) doesn't need to know the shape. */
      return (data ?? []).map((r: any) => ({
        ...r,
        venture_id: r.event?.venture_id ?? null,
      })) as DbNotification[];
    },
    staleTime: 20_000,
  });
}

/* ============================================================
   Writes
   ============================================================ */

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDismissNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/* ============================================================
   Emit — the only call site that writes to venture_events.

   Every meaningful mutation calls this. The trigger does the
   rest: resolve recipients, insert notifications, publish to
   Realtime.

   payload conventions:
     title          — what the notification says (required)
     description    — secondary line (optional)
     href           — where clicking takes you (optional)
     source_label   — the venture/workspace label (optional)
     icon_type      — 'success' | 'error' | 'warning' | 'info' | 'decision'
     recipient_ids  — explicit recipient override (optional)
   ============================================================ */

export interface EmitEventInput {
  workspaceId: string;
  ventureId?: string;
  eventType: string;
  targetType?: string;
  targetId?: string;
  payload: {
    title: string;
    description?: string;
    href?: string;
    source_label?: string;
    icon_type?: 'success' | 'error' | 'warning' | 'info' | 'decision';
    recipient_ids?: string[];
  };
}

export function useDismissAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .is('dismissed_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useEmitVentureEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmitEventInput) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');
      const { error } = await supabase.from('venture_events').insert({
        workspace_id: input.workspaceId,
        venture_id: input.ventureId ?? null,
        actor_id: auth.user.id,
        event_type: input.eventType,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        payload: input.payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      /* The trigger already created the notifications rows.
         Invalidate so any other open tab refreshes. */
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
