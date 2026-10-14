-- ============================================================
-- IV Platform — auto-create public.users on signup.
--
-- Previously, the public.users row was created only during
-- onboarding. That broke invite flow: a fresh invitee has an
-- auth.users row but no public.users row, so:
--   · the RLS policy on workspace_invites couldn't match them
--   · the invite never surfaced in usePendingInvite
--   · the user was pushed into onboarding instead
--
-- Fix: a trigger on auth.users creates the public.users row at
-- signup time. Invitees are now real users the moment they
-- authenticate — before they ever touch onboarding.
-- ============================================================

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
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Backfill any existing auth.users without a public.users row ──
insert into public.users (id, email, name)
select
  au.id,
  au.email,
  coalesce(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  )
from auth.users au
where not exists (
  select 1 from public.users u where u.id = au.id
)
on conflict (id) do nothing;
