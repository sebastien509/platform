-- ============================================================
-- thread_cleanup_24h — hard-delete threads closed > 24h ago.
--
-- The dock only renders `closed_at IS NULL` threads. Closed
-- threads (validated, dismissed, failed, abandoned) have no UI
-- surface — they only exist as an audit trail. After 24h we
-- delete them outright.
--
-- Runs hourly. Idempotent — safe to re-run.
-- ============================================================

create or replace function public.sweep_closed_threads()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.threads
  where closed_at is not null
    and closed_at < now() - interval '24 hours';
end;
$$;

-- Schedule via pg_cron if available (Supabase always has it).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Unschedulue any previous job with this name
    begin
      perform cron.unschedule('sweep-closed-threads-24h');
    exception when others then
      null;
    end;

    perform cron.schedule(
      'sweep-closed-threads-24h',
      '15 * * * *',  -- 15 min past every hour
      $cron$ select public.sweep_closed_threads(); $cron$
    );
  end if;
end $$;
