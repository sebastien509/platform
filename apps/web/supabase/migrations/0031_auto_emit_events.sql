-- ============================================================
-- IV Platform — automatic event emission.
--
-- Every meaningful DB mutation fans out into a venture_event,
-- which fan_out_venture_event converts into per-user
-- notifications.
--
--    comments.insert                        → comment.created
--    comments.update (resolved 0→1)         → comment.resolved
--    outputs.insert (status='validated')    → deliverable.validated
--    outputs.update (→ superseded)          → deliverable.superseded
--    memberships.insert                     → member.joined
--
-- (role.changed is emitted directly by the workspace-invite
--  edge function, since the actor there is service-role.)
-- ============================================================

-- ── 1. comment.created ──
create or replace function public.emit_comment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  output_rec record;
  actor_name text;
  recipient_ids uuid[];
begin
  select o.id, o.title, o.user_id, o.workspace_id, o.venture_id
    into output_rec
  from public.outputs o
  where o.id = new.output_id;

  if output_rec is null or output_rec.workspace_id is null then
    return new;
  end if;

  select coalesce(u.name, split_part(u.email, '@', 1))
    into actor_name
  from public.users u
  where u.id = new.author_id;

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
      'title', coalesce(actor_name, 'Someone') || ' commented on ' || coalesce(output_rec.title, 'a deliverable'),
      'description', left(new.body, 140),
      'icon_type', 'info',
      'recipient_ids', coalesce(to_jsonb(recipient_ids), '[]'::jsonb)
    )
  );

  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.emit_comment_created();

-- ── 2. comment.resolved ──
create or replace function public.emit_comment_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  output_rec record;
  actor_id_val uuid;
  actor_name text;
begin
  if not new.resolved or old.resolved then
    return new;
  end if;

  select o.title, o.workspace_id, o.venture_id
    into output_rec
  from public.outputs o
  where o.id = new.output_id;

  if output_rec is null or output_rec.workspace_id is null then
    return new;
  end if;

  actor_id_val := auth.uid();

  if actor_id_val is not null then
    select coalesce(u.name, split_part(u.email, '@', 1))
      into actor_name
    from public.users u
    where u.id = actor_id_val;
  end if;

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
      'title', coalesce(actor_name, 'Someone') || ' resolved a comment',
      'description', left(new.body, 140),
      'icon_type', 'success',
      'recipient_ids', case
        when new.author_id is not null then jsonb_build_array(new.author_id)
        else '[]'::jsonb
      end
    )
  );

  return new;
end;
$$;

drop trigger if exists on_comment_resolved on public.comments;
create trigger on_comment_resolved
  after update on public.comments
  for each row
  when (new.resolved = true and old.resolved = false)
  execute function public.emit_comment_resolved();

-- ── 3. deliverable.validated ──
create or replace function public.emit_deliverable_validated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  if new.workspace_id is null then
    return new;
  end if;

  select coalesce(u.name, split_part(u.email, '@', 1))
    into actor_name
  from public.users u
  where u.id = new.user_id;

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
      'title', coalesce(actor_name, 'Someone') || ' validated ' || coalesce(new.title, 'an output'),
      'description', 'v' || new.version || ' is now live',
      'icon_type', 'success',
      'href', case when new.venture_id is not null then '/ventures/' || new.venture_id else null end
    )
  );

  return new;
end;
$$;

drop trigger if exists on_output_validated on public.outputs;
create trigger on_output_validated
  after insert on public.outputs
  for each row
  when (new.status = 'validated')
  execute function public.emit_deliverable_validated();

-- ── 4. deliverable.superseded ──
create or replace function public.emit_deliverable_superseded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id_val uuid;
begin
  if new.workspace_id is null then
    return new;
  end if;

  actor_id_val := auth.uid();
  if actor_id_val is null then
    actor_id_val := new.user_id;
  end if;

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
      'title', 'New version of ' || coalesce(new.title, 'an output') || ' is now active',
      'description', 'v' || new.version || ' was superseded',
      'icon_type', 'info',
      'href', case when new.venture_id is not null then '/ventures/' || new.venture_id else null end
    )
  );

  return new;
end;
$$;

drop trigger if exists on_output_superseded on public.outputs;
create trigger on_output_superseded
  after update on public.outputs
  for each row
  when (new.status = 'superseded' and old.status != 'superseded')
  execute function public.emit_deliverable_superseded();

-- ── 5. member.joined ──
create or replace function public.emit_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_name text;
  new_user_email text;
begin
  select coalesce(u.name, split_part(u.email, '@', 1)), u.email
    into new_user_name, new_user_email
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
      'title', coalesce(new_user_name, 'A new member') || ' joined the workspace',
      'description', coalesce(new_user_email, ''),
      'icon_type', 'info'
    )
  );

  return new;
end;
$$;

drop trigger if exists on_membership_joined on public.memberships;
create trigger on_membership_joined
  after insert on public.memberships
  for each row execute function public.emit_member_joined();
