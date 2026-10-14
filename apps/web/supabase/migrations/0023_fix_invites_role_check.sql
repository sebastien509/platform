-- ============================================================
-- IV Platform — fix the workspace_invites.role constraint.
-- Same reasoning as 0022 — recreate unconditionally.
-- ============================================================

alter table public.workspace_invites
  drop constraint if exists workspace_invites_role_check;

alter table public.workspace_invites
  add constraint workspace_invites_role_check
  check (role in ('admin', 'member', 'viewer'));
