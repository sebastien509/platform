-- ============================================================
-- IV Platform — Phase 6a.4
-- Align `outputs` with the client-side Deliverable shape.
--
-- Changes:
--   1. Add 'review' to the status check — the drawer emits
--      output blocks in a needs_review state before validation.
--   2. Add columns the client tracks but the DB didn't have:
--      page_id, kind, surface_id, share_link_id, agent_id,
--      validated_at, superseded_at.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. Status constraint — four-state lifecycle
alter table public.outputs
  drop constraint if exists outputs_status_check;

alter table public.outputs
  add constraint outputs_status_check
  check (status in ('draft','review','validated','superseded'));

-- 2. New columns
alter table public.outputs
  add column if not exists page_id text,
  add column if not exists kind text,
  add column if not exists surface_id text,
  add column if not exists share_link_id text,
  add column if not exists agent_id text,
  add column if not exists validated_at timestamptz,
  add column if not exists superseded_at timestamptz;

-- 3. Query indexes — getForPage, getLatestFor, getSuperseded all filter on page_id
create index if not exists idx_outputs_page
  on public.outputs(page_id, updated_at desc);
create index if not exists idx_outputs_page_op
  on public.outputs(page_id, produced_by, version desc);
