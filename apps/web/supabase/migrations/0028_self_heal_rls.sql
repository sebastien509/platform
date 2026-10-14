-- ============================================================
-- IV Platform — allow authenticated users to insert/update
-- their own users + user_settings rows.
--
-- The signup trigger creates these rows normally. But if the
-- trigger ever fails silently (which 0027 now permits), the
-- client needs to be able to self-heal on first login.
--
-- With these policies, useCurrentUser can upsert the row when
-- it's missing, breaking the login loop.
-- ============================================================

-- ── users ──
drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users
  for insert
  with check (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── user_settings ──
drop policy if exists "user_settings_self_insert" on public.user_settings;
create policy "user_settings_self_insert" on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_self_update" on public.user_settings;
create policy "user_settings_self_update" on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Backfill orphans one more time ──
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
