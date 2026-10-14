-- ============================================================
-- IV Platform — extend plan_tier to include 'founder'.
--
-- Tiers:
--   starter   1 venture    free
--   pro       5 ventures   $29/mo
--   founder   15 ventures  $59/mo
--   team      50 ventures  $149/mo
-- ============================================================

alter table public.workspaces
  drop constraint if exists workspaces_plan_tier_check;

alter table public.workspaces
  add constraint workspaces_plan_tier_check
  check (plan_tier in ('starter', 'pro', 'founder', 'team'));

-- Ensure the column has a default of starter for new workspaces.
alter table public.workspaces
  alter column plan_tier set default 'starter';
