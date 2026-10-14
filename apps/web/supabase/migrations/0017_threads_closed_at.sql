-- ============================================================
-- IV Platform — run close state.
--
-- A run is "active" while it's in the dock; "closed" once the
-- founder validates its output or explicitly dismisses it.
-- The dock filter is: closed_at IS NULL.
--
-- Auto-close triggers (from the client store):
--   · status → 'done'   (validation complete)
--   · status → 'failed' (terminal error)
--
-- Manual close: closing the drawer while a run is active.
-- ============================================================

alter table public.threads
  add column if not exists closed_at timestamptz;

create index if not exists idx_threads_open
  on public.threads(venture_id, started_at desc)
  where closed_at is null;
