-- ============================================================
-- connector_runs — every external call writes one row.
-- Auditable, replayable, separate from outputs.
-- ============================================================

create table if not exists public.connector_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null
    references public.connectors(id) on delete cascade,
  op_id text,
  thread_id uuid
    references public.threads(id) on delete set null,
  /** Provider verb: 'gmail.send', 'github.create-repo', etc. */
  action text not null,
  /** Inputs sent to the provider — recipient, subject, config. */
  request jsonb not null default '{}'::jsonb,
  /** Provider response — message id, URL, error payload. */
  response jsonb not null default '{}'::jsonb,
  /** External resource id (Gmail message id, GitHub repo name). */
  external_id text,
  status text not null default 'pending'
    check (status in ('pending','success','error')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.connector_runs enable row level security;

create policy "connector_runs_read_own" on public.connector_runs
  for select using (
    exists (
      select 1 from public.connectors c
      where c.id = connector_id and auth.uid() = c.user_id
    )
  );

-- Insert/update handled by the service-role edge function.

create index if not exists idx_connector_runs_connector
  on public.connector_runs(connector_id, created_at desc);
create index if not exists idx_connector_runs_thread
  on public.connector_runs(thread_id, created_at desc);
