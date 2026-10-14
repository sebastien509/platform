-- ============================================================
-- IV Platform — trigger fallback for unknown event types.
--
-- Before: unknown event types fell into an empty recipient list
-- and silently produced no notifications.
--
-- After: unknown event types fan out to every workspace member
-- (minus the actor). Known event types keep their specific rules.
-- An explicit `recipient_ids: []` in the payload still forces
-- log-only behavior when that's what you want.
-- ============================================================

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
  -- Actor's display name — used on every notification row.
  select coalesce(u.name, split_part(u.email, '@', 1))
    into actor_name_val
  from public.users u
  where u.id = new.actor_id;

  -- ── Recipient resolution ──
  --   1. Explicit list in payload (even if empty — respects intent)
  --   2. Known event types get specific rules
  --   3. Everything else → all workspace members (safe default)
  if new.payload ? 'recipient_ids' then
    select array_agg(x::uuid)
      into recipients
    from jsonb_array_elements_text(new.payload->'recipient_ids') as x;
  elsif new.event_type = 'member.joined' then
    -- Owner + admin only (not "member.joined" notification for viewers)
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id
      and m.role in ('owner','admin');
  else
    -- Default: every member of the workspace, excluding the actor below.
    -- This catches deliverable.validated, comment.created, and any
    -- future event_type without requiring a trigger update.
    select array_agg(m.user_id)
      into recipients
    from public.memberships m
    where m.workspace_id = new.workspace_id;
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
