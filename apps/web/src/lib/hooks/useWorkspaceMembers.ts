import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  email: string;
  name: string | null;
}

export interface CreateInviteResult {
  ok: true;
  invite: WorkspaceInvite;
  emailSent: boolean;
  emailError: string | null;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
}

export interface WorkspaceMembersResponse {
  ok: true;
  role: WorkspaceRole;
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
}

async function call<T>(method: string, input: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke('workspace-invite', {
    body: { method, input },
  });
  if (error) throw new Error(error.message);
  const out = data?.output;
  if (!out || out.error) {
    throw new Error(out?.message ?? out?.error ?? 'Request failed');
  }
  return out as T;
}

export function useWorkspaceMembers(workspaceId: string | null | undefined) {
  return useQuery<WorkspaceMembersResponse>({
    queryKey: ['workspace-members', workspaceId ?? null],
    enabled: Boolean(workspaceId),
    queryFn: () => call<WorkspaceMembersResponse>('list', { workspaceId }),
    staleTime: 15_000,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      email: string;
      role: 'admin' | 'member' | 'viewer';
    }) => call<CreateInviteResult>('create', input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', vars.workspaceId] });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { inviteId: string; workspaceId: string }) =>
      call<{ ok: true }>('revoke', { inviteId: input.inviteId }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', vars.workspaceId] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; workspaceId: string }) =>
      call<{ ok: true }>('remove', { membershipId: input.membershipId }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', vars.workspaceId] });
    },
  });
}

export function useSetMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      membershipId: string;
      role: 'admin' | 'member' | 'viewer';
      workspaceId: string;
    }) =>
      call<{ ok: true }>('set-role', {
        membershipId: input.membershipId,
        role: input.role,
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', vars.workspaceId] });
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (token: string) =>
      call<{ ok: true; workspaceId: string }>('accept', { token }),
  });
}
