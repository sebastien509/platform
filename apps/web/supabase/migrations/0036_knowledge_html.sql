-- ============================================================
-- knowledge_entries.html — self-contained HTML for research memos.
--
-- The LLM now produces both:
--   · sections  — structured data for search, evidence, chips
--   · html      — a self-contained document for rendering
--
-- The drawer prefers html when present. Sections stay for the
-- existing search + evidence machinery.
-- ============================================================

alter table public.knowledge_entries
  add column if not exists html text;
