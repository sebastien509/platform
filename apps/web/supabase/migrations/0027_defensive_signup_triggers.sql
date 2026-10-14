-- ============================================================
-- IV Platform — make the signup triggers defensive.
--
-- If either trigger throws, the auth.users insert rolls back
-- and the founder can't sign up at all. That's what we're
-- seeing now.
--
-- Fix: wrap both trigger bodies in EXCEPTION handlers so a
-- failure logs a warning but never blocks the auth insert.
-- The affected row is reconciled lazily on first login by
-- useCurrentUser's fallback path.
-- ============================================================

-- ── users trigger ──
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
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- ── user_settings trigger ──
create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user_settings failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- ── Re-assert the triggers point at the new functions ──
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_user_created_settings on public.users;
create trigger on_user_created_settings
  after insert on public.users
  for each row execute function public.handle_new_user_settings();

-- ── Backfill anything orphaned from the broken window ──
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
where not exists (select 1 from public.users u where u.id = au.id)
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select u.id from public.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id)
on conflict (user_id) do nothing;
