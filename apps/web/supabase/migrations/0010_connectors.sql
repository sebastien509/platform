-- ============================================================
-- IV Platform — Phase 7.1
-- Connectors: OAuth handshake state, connection rows, token
-- storage. The client never reads tokens — RLS blocks them.
-- Only the `connector-oauth` edge function (service role) can
-- read or write the tokens table.
-- ============================================================

-- ─── connectors ───
create table if not exists public.connectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider text not null
    check (provider in (
      'gmail','calendar','github','vercel','supabase',
      'linear','hubspot','stripe','slack','posthog'
    )),
  status text not null default 'connected'
    check (status in (
      'connected','needs_reauth','error','revoked'
    )),
  account_label text,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connectors enable row level security;

create policy "connectors_read_own" on public.connectors
  for select using (auth.uid() = user_id);

create policy "connectors_insert_own" on public.connectors
  for insert with check (auth.uid() = user_id);

create policy "connectors_update_own" on public.connectors
  for update using (auth.uid() = user_id);

create policy "connectors_delete_own" on public.connectors
  for delete using (auth.uid() = user_id);

create index if not exists idx_connectors_user
  on public.connectors(user_id, provider, connected_at desc);

create unique index if not exists uq_connectors_user_provider
  on public.connectors(user_id, provider)
  where revoked_at is null;

drop trigger if exists trg_connectors_updated_at on public.connectors;
create trigger trg_connectors_updated_at
  before update on public.connectors
  for each row execute function public.set_updated_at();

-- ─── connector_oauth_state ───
-- Short-lived CSRF tokens for the OAuth round trip. The founder
-- navigates to the provider, returns with a state that must match
-- what we stored. 10-minute TTL, one-time use.
create table if not exists public.connector_oauth_state (
  state text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  return_to text,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.connector_oauth_state enable row level security;

-- No RLS policies — the client never reads/writes this directly.
-- The edge function (service role) is the only accessor.

create index if not exists idx_oauth_state_user
  on public.connector_oauth_state(user_id, created_at desc);

-- ─── connector_tokens ───
-- Tokens live here, keyed by connector_id. RLS blocks all
-- client access. Only the edge function (service role) can read.
create table if not exists public.connector_tokens (
  connector_id uuid primary key
    references public.connectors(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  raw jsonb,
  updated_at timestamptz not null default now()
);

alter table public.connector_tokens enable row level security;

-- Deliberately no policies — RLS denies by default. Service role
-- bypasses RLS for the edge function. Client code can never see
-- these tokens.
