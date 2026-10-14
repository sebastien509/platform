-- complete_onboarding: atomic workspace creation + membership + flag flip.
-- Security definer so it bypasses RLS on workspaces/memberships during
-- the founder's first-ever workspace creation.
create or replace function public.complete_onboarding(ws_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if ws_name is null or length(trim(ws_name)) = 0 then
    raise exception 'workspace name required';
  end if;

  insert into public.workspaces (name)
  values (trim(ws_name))
  returning id into new_id;

  insert into public.memberships (user_id, workspace_id, role)
  values (auth.uid(), new_id, 'owner');

  update public.users
  set onboarded_at = now()
  where id = auth.uid();

  return new_id;
end;
$$;

grant execute on function public.complete_onboarding(text) to authenticated;
