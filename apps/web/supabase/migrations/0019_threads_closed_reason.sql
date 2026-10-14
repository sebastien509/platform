-- ============================================================
-- IV Platform — why a run closed.
--
-- closed_at marks the run as no longer in the dock. The reason
-- distinguishes:
--   'validated'  → output shipped
--   'failed'     → agent error
--   'abandoned'  → founder killed it mid-flight
--   'dismissed'  → founder closed an in-flight run without validating
--
-- Outcomes filters on this: 'failed' shows as an error card,
-- 'abandoned' / 'dismissed' do not (founder's choice, not a bug).
-- ============================================================

alter table public.threads
  add column if not exists closed_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'threads_closed_reason_check'
  ) then
    alter table public.threads
      add constraint threads_closed_reason_check
      check (
        closed_reason is null
        or closed_reason in ('validated', 'failed', 'abandoned', 'dismissed')
      );
  end if;
end $$;
