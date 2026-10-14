-- ============================================================
-- IV Platform — the notification layer.
--
-- Two tables, one trigger, one realtime publication:
--
--   venture_events   immutable log of every meaningful action
--   notifications    per-user fan-out (a projection of events)
--
-- The trigger fires on every venture_events INSERT, resolves
-- recipients (from payload.recipient_ids or by event_type rules),
-- excludes the actor, and inserts one notifications row per
-- recipient.
--
-- Realtime is enabled on notifications so the bell badge updates
-- without polling.
-- ============================================================

-- ── venture_events ──
create table if not exists public.venture_events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  venture_id   uuid references public.ventures(id) on delete cascade,
  actor_id     uuid references public.users(id) on delete set null,
  event_type   text not null,
  target_type  text,
  target_id    uuid,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_venture_events_workspace
  on public.venture_events(workspace_id, created_at desc);
create index if not exists idx_venture_events_venture
  on public.venture_events(venture_id, created_at desc)
  where venture_id is not null;
create index if not exists idx_venture_events_actor
  on public.venture_events(actor_id, created_at desc)
  where actor_id is not null;
create index if not exists idx_venture_events_type
  on public.venture_events(event_type, created_at desc);

alter table public.venture_events enable row level security;

drop policy if exists "venture_events_read_if_member" on public.venture_events;
create policy "venture_events_read_if_member" on public.venture_events
  for select
  using (
    exists (
      select 1 from public.memberships m
      where m.workspace_id = venture_events.workspace_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "venture_events_insert_if_member" on public.venture_events;
create policy "venture_events_insert_if_member" on public.venture_events
  for insert
  with check (
    auth.uid() = actor_id
    and exists (
      select 1 from public.memberships m
      where m.workspace_id = venture_events.workspace_id
        and m.user_id = auth.uid()
    )
  );

-- ── notifications ──
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  event_id      uuid not null references public.venture_events(id) on delete cascade,
  event_type    text not null,
  title         text not null,
  description   text,
  href          text,
  actor_name    text,
  source_label  text,
  icon_type     text not null default 'info'
                check (icon_type in ('success','error','warning','info','decision')),
  read_at       timestamptz,
  dismissed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null and dismissed_at is null;
create index if not exists idx_notifications_user_all
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

-- ── fan-out trigger ──
create or replace function public.fan_out_venture_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipients uuid[];
  recipient_id uuid;
  actor_name_val text;
begin
  -- Resolve the actor's display name once.
  select coalesce(u.name, split_part(u.email, '@', 1))
    into actor_name_val
  from public.users u
  where u.id = new.actor_id;

  -- Recipient resolution order:
  --   1. Explicit recipient_ids in the payload
  --   2. Known event_type rules
  --   3. Empty (event stays log-only)
  if new.payload ? 'recipient_ids' then
    select array_agg(x::uuid)
      into recipients
    from jsonb_array_elements_text(new.payload->'recipient_ids') as x;
  elsif new.event_type in ('deliverable.validated','deliverable.superseded') then
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id
      and m.role in ('owner','admin','member');
  elsif new.event_type = 'member.joined' then
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id
      and m.role in ('owner','admin');
  else
    recipients := array[]::uuid[];
  end if;

  -- Never notify the actor about their own action.
  if recipients is not null and new.actor_id is not null then
    recipients := array_remove(recipients, new.actor_id);
  end if;

  if recipients is not null then
    foreach recipient_id in array recipients loop
      insert into public.notifications (
        user_id, event_id, event_type, title, description,
        href, actor_name, source_label, icon_type
      )
      values (
        recipient_id,
        new.id,
        new.event_type,
        coalesce(new.payload->>'title', new.event_type),
        new.payload->>'description',
        new.payload->>'href',
        actor_name_val,
        new.payload->>'source_label',
        coalesce(new.payload->>'icon_type', 'info')
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists on_venture_event_created on public.venture_events;
create trigger on_venture_event_created
  after insert on public.venture_events
  for each row execute function public.fan_out_venture_event();

-- ── Realtime ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Realtime needs the full row for the client to see it.
alter table public.notifications replica identity full;
