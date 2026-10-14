-- ============================================================
-- connector_runs.output_id — links a share action (Slack,
-- Notion) back to the deliverable it was fired from.
--
-- Used by the output card's Share row to render persistent
-- "Shared ✓" state across reloads and devices.
-- ============================================================

alter table public.connector_runs
  add column if not exists output_id uuid
    references public.outputs(id) on delete set null;

create index if not exists idx_connector_runs_output
  on public.connector_runs(output_id)
  where output_id is not null;
