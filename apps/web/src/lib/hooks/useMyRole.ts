import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/useCurrentUser';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMembership {
  workspaceId: string;
  role: WorkspaceRole;
}

/**
 * useMyMemberships — every workspace this user belongs to, with role.
 * Single query, cached for 60s.
 */
export function useMyMemberships() {
  const me = useCurrentUser();
  const userId = (me.data as any)?.id ?? (me.data as any)?.userId;

  return useQuery<WorkspaceMembership[]>({
    queryKey: ['my-memberships', userId ?? null],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('workspace_id, role')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        workspaceId: row.workspace_id,
        role: (row.role as WorkspaceRole) ?? 'member',
      }));
    },
  });
}

/**
 * useMyRole — the current user's role in a specific workspace.
 * Returns null when they're not a member.
 */
export function useMyRole(workspaceId: string | undefined) {
  const memberships = useMyMemberships();
  if (!workspaceId) return { role: null, isLoading: false };
  const found = memberships.data?.find((m) => m.workspaceId === workspaceId);
  return {
    role: found?.role ?? null,
    isLoading: memberships.isLoading,
  };
}

/** Capability helpers — derived from role. */
/** Owners create new ideas. Every venture begins in the idea
 *  journey — no other role starts new work at the workspace level. */
export function canCreateIdeas(role: WorkspaceRole | null): boolean {
  return role === 'owner';
}

export function canRunOps(role: WorkspaceRole | null): boolean {
  if (!role) return false;
  return role === 'owner' || role === 'admin' || role === 'member';
}

export function canInvite(role: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageBilling(role: WorkspaceRole | null): boolean {
  return role === 'owner';
}

export function canDeleteWorkspace(role: WorkspaceRole | null): boolean {
  return role === 'owner';
}

export function canEditDeliverables(role: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}
