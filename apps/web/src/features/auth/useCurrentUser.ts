import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profile_role: 'technical' | 'business' | 'design' | 'other' | null;
  expertise_tags: string[];
  onboarded_at: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: string;
  sidebar_collapsed: boolean;
  spend_threshold_usd: number;
  auto_continue_phases: boolean;
  notify_email: boolean;
  notify_slack: boolean;
  weekly_digest: boolean;
}

export interface CurrentUser {
  profile: Profile;
  settings: UserSettings;
}

/**
 * useCurrentUser — reads public.users + public.user_settings for the
 * authenticated user.
 *
 * Self-healing: if the trigger ever failed to create the rows (or the
 * user signed up before the trigger existed), this upserts them on
 * first read. That's what breaks the login → /login redirect loop.
 *
 * RLS (migration 0028) allows authenticated users to insert/update
 * their own rows.
 */
export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;

      const userId = auth.user.id;
      const userEmail = auth.user.email ?? '';
      const meta = (auth.user.user_metadata ?? {}) as Record<string, unknown>;
      const fallbackName =
        (meta.name as string | undefined) ??
        (meta.full_name as string | undefined) ??
        (userEmail ? userEmail.split('@')[0] : null);

      /* ── Profile ── */
      let profile: Profile | null = null;
      {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        profile = (data as Profile | null) ?? null;
      }

      if (!profile) {
        /* Row missing — trigger never fired or rolled back. Create it. */
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            name: fallbackName,
          })
          .select('*')
          .maybeSingle();
        if (error) throw error;
        profile = (data as Profile | null) ?? null;
      }

      /* ── Settings ── */
      let settings: UserSettings | null = null;
      {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        settings = (data as UserSettings | null) ?? null;
      }

      if (!settings) {
        const { data, error } = await supabase
          .from('user_settings')
          .insert({ user_id: userId })
          .select('*')
          .maybeSingle();
        if (error) throw error;
        settings = (data as UserSettings | null) ?? null;
      }

      /* If we still can't read the rows, bail — but at least it's
       * a hard failure, not a silent null-loop. */
      if (!profile || !settings) return null;

      return { profile, settings };
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/* ============================================================
   Mutations — write to the DB, invalidate the ['me'] cache.
   ============================================================ */

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      fields: Partial<
        Pick<Profile, 'name' | 'phone' | 'profile_role' | 'expertise_tags'>
      >,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');
      const { error } = await supabase
        .from('users')
        .update(fields)
        .eq('id', auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      fields: Partial<
        Pick<
          UserSettings,
          | 'theme'
          | 'sidebar_collapsed'
          | 'spend_threshold_usd'
          | 'auto_continue_phases'
          | 'notify_email'
          | 'notify_slack'
          | 'weekly_digest'
        >
      >,
    ) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('not authenticated');
      const { error } = await supabase
        .from('user_settings')
        .update(fields)
        .eq('user_id', auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
