-- ============================================================
-- stripe_webhook_events — durable audit log for Stripe events
-- ============================================================

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  workspace_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_stripe_webhook_events_status
  on public.stripe_webhook_events(status, received_at desc);

create index if not exists idx_stripe_webhook_events_workspace
  on public.stripe_webhook_events(workspace_id, received_at desc);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "service_role_all_webhook_events" on public.stripe_webhook_events;
create policy "service_role_all_webhook_events" on public.stripe_webhook_events
  for all using (true) with check (true);
