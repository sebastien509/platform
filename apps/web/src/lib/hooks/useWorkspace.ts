import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  plan_tier?: string | null;
  venture_limit?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  billing_status?: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
}

/* ------------------------------------------------------------
   useCurrentWorkspace — the founder's own workspace.

   RLS scopes the query to workspaces the user is a member of.
   Ordering by created_at asc means the founder's own workspace
   (created during onboarding) wins over any teammate workspaces.
   ------------------------------------------------------------ */
export function useCurrentWorkspace() {
  return useQuery<Workspace | null>({
    queryKey: ['current-workspace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Workspace) ?? null;
    },
    staleTime: 5 * 60_000,
  });
}
