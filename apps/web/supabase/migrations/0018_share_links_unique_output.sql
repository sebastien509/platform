-- ============================================================
-- IV Platform — one share link per output.
--
-- The client calls createShareLink on validate. React StrictMode
-- double-fires the effect in dev, so the second call hits a
-- primary-key 409 on share_links.id.
--
-- The fix: enforce one share link per output_id at the DB level
-- and make the client's insert an upsert. Second call is now a
-- no-op.
--
-- Existing rows: keep the earliest per output_id.
-- ============================================================

-- Delete duplicate share links per output (keep the earliest)
delete from public.share_links s
where exists (
  select 1 from public.share_links s2
  where s2.output_id = s.output_id
    and s2.created_at < s.created_at
);

create unique index if not exists idx_share_links_output_unique
  on public.share_links(output_id);
