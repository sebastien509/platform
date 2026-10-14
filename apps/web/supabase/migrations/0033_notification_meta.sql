-- ============================================================
-- IV Platform — structured event payloads.
--
-- Before: emit functions built sentences like
--   "Babas validated ICP v6 is now live"
-- in PL/pgSQL. Copy changes needed migrations. No i18n.
--
-- After: emit functions store structured data:
--   { action, target_title, version, page_id, ... }
-- The client renders the sentence. The DB just records what
-- happened.
--
-- The `meta` column carries the structured payload. `title`
-- stays as a fallback for old rows and for server-side email
-- renderers, but is no longer authoritative.
-- ============================================================

alter table public.notifications
  add column if not exists meta jsonb;

-- ── 1. comment.created ──
create or replace function public.emit_comment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  output_rec record;
  recipient_ids uuid[];
begin
  select o.id, o.title, o.user_id, o.workspace_id, o.venture_id, o.page_id
    into output_rec
  from public.outputs o
  where o.id = new.output_id;

  if output_rec is null or output_rec.workspace_id is null then
    return new;
  end if;

  select array_agg(distinct uid)
    into recipient_ids
  from (
    select output_rec.user_id as uid
    union
    select c.author_id as uid
      from public.comments c
      where c.output_id = new.output_id
        and c.author_id is not null
        and c.id != new.id
  ) sub
  where uid is not null and uid != new.author_id;

  insert into public.venture_events (
    workspace_id, venture_id, actor_id, event_type,
    target_type, target_id, payload
  ) values (
    output_rec.workspace_id,
    output_rec.venture_id,
    new.author_id,
    'comment.created',
    'output',
    new.output_id,
    jsonb_build_object(
      'action', 'commented',
      'target_title', output_rec.title,
      'target_type', 'output',
      'target_id', new.output_id,
      'body_preview', left(new.body, 140),
      'page_id', output_rec.page_id,
      'icon_type', 'info',
      'recipient_ids', coalesce(to_jsonb(recipient_ids), '[]'::jsonb)
    )
  );

  return new;
end;
$func$;

-- ── 2. comment.resolved ──
create or replace function public.emit_comment_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  output_rec record;
  actor_id_val uuid;
begin
  if not new.resolved or old.resolved then
    return new;
  end if;

  select o.title, o.workspace_id, o.venture_id, o.page_id
    into output_rec
  from public.outputs o
  where o.id = new.output_id;

  if output_rec is null or output_rec.workspace_id is null then
    return new;
  end if;

  actor_id_val := auth.uid();

  insert into public.venture_events (
    workspace_id, venture_id, actor_id, event_type,
    target_type, target_id, payload
  ) values (
    output_rec.workspace_id,
    output_rec.venture_id,
    actor_id_val,
    'comment.resolved',
    'comment',
    new.id,
    jsonb_build_object(
      'action', 'resolved',
      'target_title', output_rec.title,
      'target_type', 'output',
      'target_id', new.output_id,
      'body_preview', left(new.body, 140),
      'page_id', output_rec.page_id,
      'icon_type', 'success',
      'recipient_ids', case
        when new.author_id is not null then jsonb_build_array(new.author_id)
        else '[]'::jsonb
      end
    )
  );

  return new;
end;
$func$;

-- ── 3. deliverable.validated ──
create or replace function public.emit_deliverable_validated()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.workspace_id is null then
    return new;
  end if;

  insert into public.venture_events (
    workspace_id, venture_id, actor_id, event_type,
    target_type, target_id, payload
  ) values (
    new.workspace_id,
    new.venture_id,
    new.user_id,
    'deliverable.validated',
    'output',
    new.id,
    jsonb_build_object(
      'action', 'validated',
      'target_title', new.title,
      'target_type', 'output',
      'target_id', new.id,
      'version', new.version,
      'page_id', new.page_id,
      'icon_type', 'success'
    )
  );

  return new;
end;
$func$;

-- ── 4. deliverable.superseded ──
create or replace function public.emit_deliverable_superseded()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  actor_id_val uuid;
  new_version int4;
begin
  if new.workspace_id is null then
    return new;
  end if;

  actor_id_val := auth.uid();
  if actor_id_val is null then
    actor_id_val := new.user_id;
  end if;

  select o.version into new_version
  from public.outputs o
  where o.id = new.superseded_by;

  insert into public.venture_events (
    workspace_id, venture_id, actor_id, event_type,
    target_type, target_id, payload
  ) values (
    new.workspace_id,
    new.venture_id,
    actor_id_val,
    'deliverable.superseded',
    'output',
    new.id,
    jsonb_build_object(
      'action', 'superseded',
      'target_title', new.title,
      'target_type', 'output',
      'target_id', new.id,
      'version', new.version,
      'new_version', new_version,
      'page_id', new.page_id,
      'icon_type', 'info'
    )
  );

  return new;
end;
$func$;

-- ── 5. member.joined ──
create or replace function public.emit_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  new_user_email text;
begin
  select u.email into new_user_email
  from public.users u
  where u.id = new.user_id;

  insert into public.venture_events (
    workspace_id, actor_id, event_type,
    target_type, target_id, payload
  ) values (
    new.workspace_id,
    new.user_id,
    'member.joined',
    'membership',
    new.id,
    jsonb_build_object(
      'action', 'joined',
      'target_type', 'membership',
      'target_id', new.id,
      'email', coalesce(new_user_email, ''),
      'role', new.role,
      'icon_type', 'info'
    )
  );

  return new;
end;
$func$;

-- ── Fan-out trigger — pass meta through ──
create or replace function public.fan_out_venture_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  recipients uuid[];
  recipient_id uuid;
  actor_name_val text;
begin
  select coalesce(u.name, split_part(u.email, '@', 1))
    into actor_name_val
  from public.users u
  where u.id = new.actor_id;

  if new.payload ? 'recipient_ids' then
    select array_agg(x::uuid)
      into recipients
    from jsonb_array_elements_text(new.payload->'recipient_ids') as x;
  elsif new.event_type = 'member.joined' then
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id
      and m.role in ('owner','admin');
  else
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id;
  end if;

  if recipients is not null and new.actor_id is not null then
    recipients := array_remove(recipients, new.actor_id);
  end if;

  if recipients is not null then
    foreach recipient_id in array recipients loop
      insert into public.notifications (
        user_id, event_id, event_type,
        title, description, href, actor_name, source_label, icon_type,
        meta
      )
      values (
        recipient_id,
        new.id,
        new.event_type,
        new.payload->>'action',       -- short fallback label
        null,                          -- description built on client
        null,                          -- href built on client
        actor_name_val,
        null,
        coalesce(new.payload->>'icon_type', 'info'),
        new.payload                    -- structured payload
      );
    end loop;
  end if;

  return new;
end;
$func$;
