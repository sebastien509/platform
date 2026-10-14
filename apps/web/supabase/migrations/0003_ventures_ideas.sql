-- ============================================================
-- IV Platform — Phase 6b.1
-- Ventures, Ideas, Knowledge entries + RLS.
-- Order: ideas → ventures (ventures references ideas).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Shared: updated_at trigger helper
-- ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- IDEAS — pre-venture concepts. Local until Validate, then bulk pushed.
-- ────────────────────────────────────────────────────────────
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  stage text not null default 'capture'
    check (stage in (
      'capture','clean','research','synthesize','validate',
      'transition','transitioned','killed'
    )),

  -- Stage payloads (JSONB — populated progressively from the client)
  capture_payload jsonb not null default '{}'::jsonb,
  clean_payload   jsonb not null default '{}'::jsonb,
  structured      jsonb not null default '{}'::jsonb,
  validation      jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ideas enable row level security;

create policy "ideas_read_own" on public.ideas
  for select using (auth.uid() = user_id);

create policy "ideas_insert_own" on public.ideas
  for insert with check (auth.uid() = user_id);

create policy "ideas_update_own" on public.ideas
  for update using (auth.uid() = user_id);

create policy "ideas_delete_own" on public.ideas
  for delete using (auth.uid() = user_id);

create index if not exists idx_ideas_user_stage
  on public.ideas(user_id, stage, updated_at desc);
create index if not exists idx_ideas_user_updated
  on public.ideas(user_id, updated_at desc);

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- VENTURES — the container. Belongs to a workspace. Optionally seeded
-- from an idea.
-- ────────────────────────────────────────────────────────────
create table if not exists public.ventures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_idea_id uuid references public.ideas(id) on delete set null,

  name text not null,
  description text,
  status text not null default 'validating'
    check (status in (
      'validating','building','launching','operating','paused','archived'
    )),
  health jsonb not null default '{}'::jsonb,
  inherited_hue int,

  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.ventures enable row level security;

create policy "ventures_read_if_member" on public.ventures
  for select using (public.is_workspace_member(workspace_id));

create policy "ventures_insert_if_member" on public.ventures
  for insert with check (
    public.is_workspace_member(workspace_id)
    and auth.uid() = created_by
  );

create policy "ventures_update_if_member" on public.ventures
  for update using (public.is_workspace_member(workspace_id));

create index if not exists idx_ventures_workspace_status
  on public.ventures(workspace_id, status, updated_at desc);
create index if not exists idx_ventures_source_idea
  on public.ventures(source_idea_id);

drop trigger if exists trg_ventures_updated_at on public.ventures;
create trigger trg_ventures_updated_at
  before update on public.ventures
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- KNOWLEDGE ENTRIES — research outputs. Scoped to idea OR venture,
-- always owned by a user, sometimes inside a workspace.
-- ────────────────────────────────────────────────────────────
create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  venture_id uuid references public.ventures(id) on delete cascade,

  type text not null
    check (type in (
      'research_report','market_analysis','competitive_analysis',
      'interview_transcript','customer_insight','founder_selection',
      'synthesized_answer','research_note','document'
    )),
  origin text not null
    check (origin in (
      'idea_research','idea_founder','venture_agent',
      'venture_founder','inquiry'
    )),
  title text not null,
  summary text,
  content text,
  citations jsonb not null default '[]'::jsonb,
  confidence int,
  contributing_agent text,

  related_entry_ids uuid[] not null default '{}',
  referenced_by_outcome_ids uuid[] not null default '{}',

  created_at timestamptz not null default now()
);

alter table public.knowledge_entries enable row level security;

create policy "knowledge_read_own_or_workspace" on public.knowledge_entries
  for select using (
    auth.uid() = user_id
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

create policy "knowledge_insert_own" on public.knowledge_entries
  for insert with check (auth.uid() = user_id);

create policy "knowledge_update_own" on public.knowledge_entries
  for update using (auth.uid() = user_id);

create policy "knowledge_delete_own" on public.knowledge_entries
  for delete using (auth.uid() = user_id);

create index if not exists idx_knowledge_user
  on public.knowledge_entries(user_id, created_at desc);
create index if not exists idx_knowledge_workspace
  on public.knowledge_entries(workspace_id, created_at desc);
create index if not exists idx_knowledge_venture
  on public.knowledge_entries(venture_id, created_at desc);
create index if not exists idx_knowledge_idea
  on public.knowledge_entries(idea_id, created_at desc);
