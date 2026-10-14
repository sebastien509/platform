-- ============================================================
-- IV Platform — Phase 6a.1
-- Agent runs (threads), deliverables (outputs), DB-stored
-- content (output_payloads), and comments.
--
-- Design: the run's full block timeline lives in threads.blocks
-- as JSONB. Splitting into thread_messages rows would be
-- cleaner for search but adds join cost to every drawer open.
-- Postgres handles large JSONB fine; a split can come later if
-- we ever need cross-thread message search.
--
-- Outputs follow three content strategies:
--   content_kind = 'db'       → row in output_payloads (JSONB)
--   content_kind = 'storage'  → row in storage, ref is the path
--   content_kind = 'external' → repo URL, Vercel URL, etc.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- THREADS — one row per agent run. Persisted after the run
-- completes, or incrementally as blocks emit.
-- ────────────────────────────────────────────────────────────
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,

  -- Scope — the run may belong to an idea, a venture, or neither
  -- (cross-workspace chat). At most one is set for practical use.
  idea_id uuid references public.ideas(id) on delete set null,
  venture_id uuid references public.ventures(id) on delete set null,

  -- Classification
  kind text not null default 'agent_chat'
    check (kind in (
      'idea_capture','idea_clean','idea_research','idea_synthesize',
      'op_run','agent_chat'
    )),
  agent_id text,                   -- 'research', 'strategy', 'builder'
  objective text,
  op_id text,                      -- when triggered by an op
  page text,                       -- 'strategy', 'product', etc.

  -- State
  status text not null default 'working'
    check (status in (
      'working','needs_you','review_ready','done','failed','paused'
    )),

  -- The block timeline (AgentBlock[]) — one JSONB array
  blocks jsonb not null default '[]'::jsonb,

  -- Conversation mode (research, chat) keeps the composer visible
  conversation_mode boolean not null default false,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.threads enable row level security;

create policy "threads_read_own_or_workspace" on public.threads
  for select using (
    auth.uid() = user_id
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

create policy "threads_insert_own" on public.threads
  for insert with check (auth.uid() = user_id);

create policy "threads_update_own" on public.threads
  for update using (auth.uid() = user_id);

create policy "threads_delete_own" on public.threads
  for delete using (auth.uid() = user_id);

create index if not exists idx_threads_user_updated
  on public.threads(user_id, updated_at desc);
create index if not exists idx_threads_idea
  on public.threads(idea_id, updated_at desc);
create index if not exists idx_threads_venture
  on public.threads(venture_id, updated_at desc);
create index if not exists idx_threads_workspace
  on public.threads(workspace_id, updated_at desc);

drop trigger if exists trg_threads_updated_at on public.threads;
create trigger trg_threads_updated_at
  before update on public.threads
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- OUTPUTS — every deliverable the platform produces.
-- An output is a file or a content blob, never a variable.
-- ────────────────────────────────────────────────────────────
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  venture_id uuid references public.ventures(id) on delete cascade,
  thread_id uuid references public.threads(id) on delete set null,

  -- Provenance
  produced_by text not null,        -- op id | 'user' | 'import'
  render_type text not null
    check (render_type in (
      'markdown','html','deck','report','code','sheet','repo','operational'
    )),
  tier text not null default 'primary'
    check (tier in ('primary','secondary')),

  -- Display
  title text not null,
  destination text,                 -- "Strategy › Brief"
  status text not null default 'draft'
    check (status in ('draft','validated','superseded')),

  -- Content strategy
  content_kind text not null default 'db'
    check (content_kind in ('db','storage','external')),
  content_ref text,                 -- payload id | storage path | external URL

  -- Versioning
  version int not null default 1,
  superseded_by uuid references public.outputs(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.outputs enable row level security;

create policy "outputs_read_own_or_workspace" on public.outputs
  for select using (
    auth.uid() = user_id
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

create policy "outputs_insert_own" on public.outputs
  for insert with check (auth.uid() = user_id);

create policy "outputs_update_own" on public.outputs
  for update using (auth.uid() = user_id);

create policy "outputs_delete_own" on public.outputs
  for delete using (auth.uid() = user_id);

create index if not exists idx_outputs_user_updated
  on public.outputs(user_id, updated_at desc);
create index if not exists idx_outputs_venture
  on public.outputs(venture_id, updated_at desc);
create index if not exists idx_outputs_thread
  on public.outputs(thread_id);
create index if not exists idx_outputs_status
  on public.outputs(venture_id, status, updated_at desc);

drop trigger if exists trg_outputs_updated_at on public.outputs;
create trigger trg_outputs_updated_at
  before update on public.outputs
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- OUTPUT_PAYLOADS — the DB-stored content store.
-- Kept in a sibling table so metadata queries on outputs never
-- load the content blob into memory.
-- ────────────────────────────────────────────────────────────
create table if not exists public.output_payloads (
  output_id uuid primary key
    references public.outputs(id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.output_payloads enable row level security;

-- Payload access mirrors output access. The user must own the
-- parent output (or be a workspace member).
create policy "output_payloads_read" on public.output_payloads
  for select using (
    exists (
      select 1 from public.outputs o
      where o.id = output_id
        and (
          auth.uid() = o.user_id
          or (o.workspace_id is not null and public.is_workspace_member(o.workspace_id))
        )
    )
  );

create policy "output_payloads_insert" on public.output_payloads
  for insert with check (
    exists (
      select 1 from public.outputs o
      where o.id = output_id and auth.uid() = o.user_id
    )
  );

create policy "output_payloads_update" on public.output_payloads
  for update using (
    exists (
      select 1 from public.outputs o
      where o.id = output_id and auth.uid() = o.user_id
    )
  );

create policy "output_payloads_delete" on public.output_payloads
  for delete using (
    exists (
      select 1 from public.outputs o
      where o.id = output_id and auth.uid() = o.user_id
    )
  );

drop trigger if exists trg_output_payloads_updated_at on public.output_payloads;
create trigger trg_output_payloads_updated_at
  before update on public.output_payloads
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- COMMENTS — founder notes + external share viewer comments.
-- author_id is nullable so external viewers can comment without
-- a user row.
-- ────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references public.outputs(id) on delete cascade,

  -- Author — either an authed user OR an external viewer name
  author_id uuid references public.users(id) on delete set null,
  author_name text,                 -- for external viewers

  body text not null,
  resolved boolean not null default false,

  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- Read: anyone who can see the parent output
create policy "comments_read_via_output" on public.comments
  for select using (
    exists (
      select 1 from public.outputs o
      where o.id = output_id
        and (
          auth.uid() = o.user_id
          or (o.workspace_id is not null and public.is_workspace_member(o.workspace_id))
        )
    )
  );

-- Insert: the author is either the current user OR the
-- comment has no author_id (external viewer path via share link).
create policy "comments_insert" on public.comments
  for insert with check (
    auth.uid() = author_id
    or author_id is null
  );

-- Update / delete: only the author (or the output owner for
-- moderation)
create policy "comments_update_own" on public.comments
  for update using (
    auth.uid() = author_id
    or exists (
      select 1 from public.outputs o
      where o.id = output_id and auth.uid() = o.user_id
    )
  );

create policy "comments_delete_own" on public.comments
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.outputs o
      where o.id = output_id and auth.uid() = o.user_id
    )
  );

create index if not exists idx_comments_output
  on public.comments(output_id, created_at asc);
create index if not exists idx_comments_unresolved
  on public.comments(output_id, resolved)
  where resolved = false;
