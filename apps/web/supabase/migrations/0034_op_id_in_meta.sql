-- ============================================================
-- IV Platform — capture op_id in every event meta so the client
-- can route to the right page even when page_id is missing.
-- ============================================================

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
  select o.id, o.title, o.user_id, o.workspace_id, o.venture_id,
         o.page_id, o.kind
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
      'op_id', output_rec.kind,
      'icon_type', 'info',
      'recipient_ids', coalesce(to_jsonb(recipient_ids), '[]'::jsonb)
    )
  );

  return new;
end;
$func$;

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

  select o.title, o.workspace_id, o.venture_id, o.page_id, o.kind
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
      'op_id', output_rec.kind,
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
      'op_id', new.kind,
      'icon_type', 'success'
    )
  );

  return new;
end;
$func$;

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
      'op_id', new.kind,
      'icon_type', 'info'
    )
  );

  return new;
end;
$func$;
