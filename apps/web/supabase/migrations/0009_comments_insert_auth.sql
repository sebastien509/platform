-- ============================================================
-- Tighten comments_insert policy. Direct inserts must carry
-- the founder's own auth.uid(). Guests don't insert directly —
-- they go through the `share-guest` edge function which uses
-- service_role and bypasses RLS entirely.
--
-- Previous policy allowed `author_id is null` from the client,
-- which silently inserted unattributed rows when auth wasn't
-- resolved yet.
-- ============================================================

drop policy if exists "comments_insert" on public.comments;

create policy "comments_insert" on public.comments
  for insert with check (
    auth.uid() is not null
    and auth.uid() = author_id
  );
