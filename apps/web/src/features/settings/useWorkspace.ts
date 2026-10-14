import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'owner' | 'collaborator' | 'viewer';
  joined_at: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface CurrentWorkspace {
  id: string;
  name: string;
  plan_tier: 'starter' | 'pro' | 'team';
  created_at: string;
  myRole: 'owner' | 'collaborator' | 'viewer';
  members: WorkspaceMember[];
}

/**
 * useWorkspace — reads the founder's primary workspace.
 *
 * For 6a we only ever have ONE workspace per user (created during
 * onboarding). When multi-workspace ships, this becomes a param.
 */
export function useWorkspace() {
  return useQuery<CurrentWorkspace | null>({
    queryKey: ['workspace', 'current'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;

      // Find my membership + the workspace it points at.
      const { data: membership, error: mErr } = await supabase
        .from('memberships')
        .select(`
          role,
          workspaces (
            id,
            name,
            plan_tier,
            created_at
          )
        `)
        .eq('user_id', auth.user.id)
        .limit(1)
        .maybeSingle();

      if (mErr) throw mErr;
      if (!membership || !membership.workspaces) return null;

      const ws = membership.workspaces as unknown as {
        id: string;
        name: string;
        plan_tier: 'starter' | 'pro' | 'team';
        created_at: string;
      };

      // Fetch members + their user profiles in one pass.
      const { data: rawMembers, error: rErr } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          users (
            id,
            name,
            email
          )
        `)
        .eq('workspace_id', ws.id)
        .order('joined_at', { ascending: true });

      if (rErr) throw rErr;

      const members: WorkspaceMember[] = (rawMembers ?? []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: m.users
          ? { id: m.users.id, name: m.users.name, email: m.users.email }
          : null,
      }));

      return {
        id: ws.id,
        name: ws.name,
        plan_tier: ws.plan_tier,
        created_at: ws.created_at,
        myRole: membership.role as any,
        members,
      };
    },
    staleTime: 60_000,
  });
}
