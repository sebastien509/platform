-- ============================================================
-- Add 'notion' to the connectors.provider check constraint.
-- ============================================================

alter table public.connectors
  drop constraint if exists connectors_provider_check;

alter table public.connectors
  add constraint connectors_provider_check
  check (provider in (
    'gmail','calendar','github','vercel','supabase',
    'linear','hubspot','stripe','slack','posthog','notion'
  ));
