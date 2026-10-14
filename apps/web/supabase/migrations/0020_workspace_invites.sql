-- ============================================================
-- IV Platform — Phase 6a.2 · membership invites
--
-- Roles:
--   owner   — one per workspace, created at onboarding
--   admin   — can invite + remove members
--   member  — runs ops, validates, comments
--   viewer  — read + comment only (advisors)
--
-- Invite lifecycle:
--   create  → row with expires_at = now() + 7 days
--   accept  → creates memberships row, sets accepted_at
--   revoke  → sets revoked_at (before acceptance)
-- ============================================================

-- Constrain the role column on memberships (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'memberships_role_check'
  ) then
    alter table public.memberships
      add constraint memberships_role_check
      check (role in ('owner','admin','member','viewer'));
  end if;
end $$;

-- One owner per workspace
create unique index if not exists uq_memberships_owner
  on public.memberships(workspace_id)
  where role = 'owner';

-- ─── workspace_invites ───
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null
    check (role in ('admin','member','viewer')),
  invited_by uuid not null
    references public.users(id) on delete set null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.workspace_invites enable row level security;

-- Read: any member of the workspace
create policy "invites_read_if_member" on public.workspace_invites
  for select using (
    exists (
      select 1 from public.memberships m
      where m.workspace_id = workspace_invites.workspace_id
        and m.user_id = auth.uid()
    )
  );

-- Write: only through the edge function (service role). No client
-- insert/update/delete policies on purpose.

create index if not exists idx_invites_workspace
  on public.workspace_invites(workspace_id, created_at desc);
create index if not exists idx_invites_pending
  on public.workspace_invites(workspace_id)
  where accepted_at is null and revoked_at is null;
