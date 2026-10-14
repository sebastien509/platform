-- ============================================================
-- IV Platform — Stripe billing
-- Adds Stripe linkage + billing status to workspaces.
-- Every write happens from the stripe-webhook edge function
-- (service role). The client only reads.
-- ============================================================

alter table public.workspaces
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_status text default 'active';

-- Check constraint for billing_status (idempotent — skip if exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'workspaces_billing_status_check'
  ) then
    alter table public.workspaces
      add constraint workspaces_billing_status_check
      check (billing_status in ('active','past_due','canceled','trialing'));
  end if;
end $$;

create index if not exists idx_workspaces_stripe_customer
  on public.workspaces(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists idx_workspaces_stripe_subscription
  on public.workspaces(stripe_subscription_id)
  where stripe_subscription_id is not null;
