import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PendingInvite {
  id: string;
  token: string;
  email: string;
  role: string;
  expires_at: string;
  workspace_id: string;
}

/**
 * usePendingInvite — any unaccepted, unrevoked, unexpired invite
 * matching the current user's email. Used by RequireOnboarding to
 * short-circuit onboarding so an invited user lands on the accept
 * page instead of creating a fresh workspace.
 */
export function usePendingInvite() {
  return useQuery<PendingInvite | null>({
    queryKey: ['pending-invite'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const email = auth.user?.email?.toLowerCase();
      if (!email) return null;

      const { data, error } = await supabase
        .from('workspace_invites')
        .select('id, token, email, role, expires_at, workspace_id')
        .ilike('email', email)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return (data as PendingInvite) ?? null;
    },
    staleTime: 30_000,
  });
}
