-- ============================================================
-- IV Platform — invitees can read their own pending invite.
--
-- The existing policy only allows workspace members to read
-- invites. A brand-new invitee (not a member yet) needs to
-- read their own invite to accept it. Otherwise the accept
-- page can't find the row.
-- ============================================================

drop policy if exists "invites_read_own_email" on public.workspace_invites;

create policy "invites_read_own_email" on public.workspace_invites
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and lower(u.email) = lower(workspace_invites.email)
    )
  );
