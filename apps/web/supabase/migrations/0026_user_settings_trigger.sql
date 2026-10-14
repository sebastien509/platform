-- ============================================================
-- IV Platform — auto-create user_settings on new user.
--
-- useCurrentUser reads both users and user_settings. The users
-- row is created by the auth trigger (0024). The user_settings
-- row was never auto-created — it only landed during onboarding.
-- A fresh invitee signing up for the first time has users but
-- not user_settings, so .single() on the settings query threw
-- PGRST116.
-- ============================================================

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
end;
$$;

drop trigger if exists on_user_created_settings on public.users;

create trigger on_user_created_settings
  after insert on public.users
  for each row execute function public.handle_new_user_settings();

-- ── Backfill any existing users without settings ──
insert into public.user_settings (user_id)
select u.id
from public.users u
where not exists (
  select 1 from public.user_settings s where s.user_id = u.id
)
on conflict (user_id) do nothing;
