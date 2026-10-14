-- ============================================================
-- IV Platform — Phase 6a.2
-- Core tables: users, user_settings, workspaces, memberships
-- Plus RLS policies and the auth signup trigger.
--
-- Order matters:
--   1. Tables (users, user_settings, workspaces, memberships)
--   2. Helper function (needs memberships to exist)
--   3. RLS policies (some use the helper)
--   4. Trigger on auth.users
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- users — mirrors auth.users, adds profile fields
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  phone text,
  profile_role text check (profile_role in ('technical','business','design','other')),
  expertise_tags text[] default '{}',
  onboarded_at timestamptz,
  created_at timestamptz default now() not null
);

-- user_settings — 1:1 with users
create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text default 'structured',
  sidebar_collapsed boolean default false,
  spend_threshold_usd int default 100,
  auto_continue_phases boolean default false,
  notify_email boolean default true,
  notify_slack boolean default false,
  weekly_digest boolean default true
);

-- workspaces — the container for ventures
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_tier text default 'starter' not null
    check (plan_tier in ('starter','pro','team')),
  created_at timestamptz default now() not null
);

-- memberships — user ↔ workspace with role
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role text default 'owner' not null
    check (role in ('owner','collaborator','viewer')),
  joined_at timestamptz default now() not null,
  unique (user_id, workspace_id)
);

create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_workspace on public.memberships(workspace_id);

-- ────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTION (after tables exist)
-- SECURITY DEFINER avoids infinite RLS recursion on memberships.
-- ────────────────────────────────────────────────────────────
create or replace function public.is_workspace_member(wid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where workspace_id = wid and user_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;

-- users: read/write own row
drop policy if exists "users_read_own" on public.users;
create policy "users_read_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- user_settings: read/write own row
drop policy if exists "settings_read_own" on public.user_settings;
create policy "settings_read_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id);

-- workspaces: read if member
drop policy if exists "workspaces_read_if_member" on public.workspaces;
create policy "workspaces_read_if_member" on public.workspaces
  for select using (public.is_workspace_member(id));

-- memberships: read if in the same workspace
drop policy if exists "memberships_read_if_same_workspace" on public.memberships;
create policy "memberships_read_if_same_workspace" on public.memberships
  for select using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER: mirror auth.users → public.users + seed settings
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      null
    )
  );

  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
