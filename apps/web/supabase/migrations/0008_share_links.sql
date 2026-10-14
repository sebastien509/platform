-- ============================================================
-- IV Platform — Phase 6a.5.1
-- Share links + comment anchoring.
--
-- The share link's token is a capability URL. Anyone who has
-- it can read the shared output. Comments written by guests
-- flow through the `share-guest` edge function (service role).
-- ============================================================

-- ─── share_links ───
create table if not exists public.share_links (
  id text primary key,                       -- url-safe token: 'sl_xxxxxxxx'
  output_id uuid not null references public.outputs(id) on delete cascade,
  venture_id uuid references public.ventures(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  surface_id text,                           -- 'strategy.brief', etc.
  label text,
  snapshot jsonb not null,                   -- frozen content at share time
  comments_enabled boolean not null default true,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

-- Owner can read/insert/update/delete their own share links.
create policy "share_links_owner_read" on public.share_links
  for select using (auth.uid() = created_by);

create policy "share_links_owner_insert" on public.share_links
  for insert with check (auth.uid() = created_by);

create policy "share_links_owner_update" on public.share_links
  for update using (auth.uid() = created_by);

create policy "share_links_owner_delete" on public.share_links
  for delete using (auth.uid() = created_by);

-- Guests do NOT get direct RLS access. The edge function uses
-- service role and validates the token before reading/writing.

create index if not exists idx_share_links_output
  on public.share_links(output_id);
create index if not exists idx_share_links_venture
  on public.share_links(venture_id, created_at desc);

-- ─── comments: extend with section anchoring + share origin ───
alter table public.comments
  add column if not exists section_id text,
  add column if not exists section_label text,
  add column if not exists share_link_id text
    references public.share_links(id) on delete set null;

create index if not exists idx_comments_output_recent
  on public.comments(output_id, created_at desc);
