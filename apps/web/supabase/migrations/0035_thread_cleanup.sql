-- ============================================================
-- IV Platform — auto-close stale threads.
--
-- A thread is a run. Runs that never reached done/failed but
-- stopped sending updates >24h ago keep appearing in the dock
-- as "working" forever. They're not working — they're abandoned.
--
-- This closes them. closed_at + closed_reason = 'dismissed'.
-- They stay in the DB (audit trail, "View threads" still works)
-- but they drop out of every dock filter.
-- ============================================================

create or replace function public.cleanup_stale_threads()
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  affected integer;
begin
  update public.threads
  set
    closed_at = coalesce(closed_at, now()),
    closed_reason = coalesce(closed_reason, 'dismissed'),
    completed_at = coalesce(completed_at, now())
  where
    closed_at is null
    and started_at < now() - interval '24 hours'
    and status not in ('done', 'failed');

  get diagnostics affected = row_count;
  return affected;
end;
$func$;

-- ── Schedule hourly via pg_cron (if available) ──
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('cleanup-stale-threads');
    exception when others then
      null;
    end;
    perform cron.schedule(
      'cleanup-stale-threads',
      '0 * * * *',
      $sql$select public.cleanup_stale_threads();$sql$
    );
  end if;
end;
$do$;
