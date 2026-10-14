# Supabase — provisioning guide

1. Go to https://supabase.com/dashboard
2. Click New project
3. Name: iv-platform-dev
4. Region: closest to you (us-east-1 for most US founders)
5. Save the DB password somewhere safe
6. Wait ~2 minutes for provisioning

## Get the two env vars

Settings -> API:

- Project URL  -> VITE_SUPABASE_URL
- anon/public  -> VITE_SUPABASE_ANON_KEY

Do NOT copy the service_role key. That bypasses RLS and never goes in the frontend.
