-- ============================================================
-- OAuth callback needs the SAME redirect_uri used during consent
-- to satisfy the provider's token exchange. Since the redirect
-- is now the SPA (not the edge function), the origin varies
-- between dev (localhost) and prod. Store it with the state.
-- ============================================================

alter table public.connector_oauth_state
  add column if not exists redirect_uri text;
