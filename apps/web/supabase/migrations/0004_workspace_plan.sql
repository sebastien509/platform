-- ============================================================
-- IV Platform — Phase 6b.2
-- Workspace plan fields. The founder starts on 'starter'
-- (1 venture); upgrading to 'pro' or 'team' raises the limit.
--
-- Manual upgrade flow:
--   update public.workspaces set plan_tier = 'pro';
--
-- The UI reads this reactively — the Validate buttons enable
-- on the next window focus.
-- ============================================================

alter table public.workspaces
  add column if not exists plan_tier text
    not null default 'starter'
    check (plan_tier in ('starter','pro','team'));

alter table public.workspaces
  add column if not exists venture_limit int;

create index if not exists idx_workspaces_plan_tier
  on public.workspaces(plan_tier);
