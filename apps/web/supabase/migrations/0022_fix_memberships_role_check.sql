-- ============================================================
-- IV Platform — fix the memberships.role constraint.
--
-- Migration 0020 assumed the constraint didn't exist. If an
-- earlier migration created a narrower check, the guard skipped
-- the update and invites fail with:
--   "violates check constraint memberships_role_check"
--
-- Drop and recreate unconditionally with all four roles.
-- ============================================================

alter table public.memberships
  drop constraint if exists memberships_role_check;

alter table public.memberships
  add constraint memberships_role_check
  check (role in ('owner', 'admin', 'member', 'viewer'));
