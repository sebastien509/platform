-- ============================================================
-- IV — landing handoffs.
--
-- A handoff is a temporary, token-addressed blob of founder input
-- captured on the marketing site. It is created without auth, then
-- claimed AFTER the founder authenticates. Only the claim step
-- creates durable data (idea, tied to a workspace).
--
-- Flow:
--   landing → POST create → handoffId
--   app/onboarding?handoff=... → auth → POST claim → idea created
-- ============================================================

create table if not exists public.handoffs (
  id                     text primary key,
  type                   text not null default 'idea',
  payload                jsonb not null,
  source                 text,
  campaign               text,
  referrer               text,
  status                 text not null default 'pending'
                           check (status in ('pending', 'claimed', 'expired')),
  created_at             timestamptz not null default now(),
  expires_at             timestamptz not null default now() + interval '48 hours',
  claimed_by_user_id     uuid references public.users(id)      on delete set null,
  claimed_workspace_id   uuid references public.workspaces(id) on delete set null,
  claimed_idea_id        uuid,
  claimed_at             timestamptz
);

create index if not exists idx_handoffs_status_expires
  on public.handoffs(status, expires_at);

create index if not exists idx_handoffs_claimed_by
  on public.handoffs(claimed_by_user_id)
  where claimed_by_user_id is not null;

alter table public.handoffs enable row level security;

-- No public access. The edge function (service role) does all the
-- work. But we allow founders to view their own claim history.
drop policy if exists "handoffs_read_own" on public.handoffs;
create policy "handoffs_read_own"
  on public.handoffs
  for select
  using (claimed_by_user_id = auth.uid());
