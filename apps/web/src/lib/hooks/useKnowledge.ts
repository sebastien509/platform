import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  knowledgeEntries,
  targetedResearchReports,
} from '@/data/mockData';
import type {
  KnowledgeEntry,
  KnowledgeEntryType,
  KnowledgeOrigin,
} from '@/lib/types';

interface UseKnowledgeOptions {
  /** Filter to a specific venture. When set to a valid UUID, the
   *  hook reads from Supabase. */
  ventureId?: string;
  /** Filter to a specific idea. When set to a valid UUID, the
   *  hook reads from Supabase. */
  ideaId?: string;
  /** Filter to specific entry types. */
  types?: KnowledgeEntryType[];
  /** Filter to specific origins. */
  origins?: KnowledgeOrigin[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string | undefined): boolean {
  return Boolean(s && UUID_RE.test(s));
}

/* ------------------------------------------------------------
   DB row shape — matches 0003_ventures_ideas.sql
   ------------------------------------------------------------ */
interface KnowledgeRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  idea_id: string | null;
  venture_id: string | null;
  type: string;
  origin: string;
  title: string;
  summary: string | null;
  content: string | null;
  citations: unknown[] | null;
  confidence: number | null;
  contributing_agent: string | null;
  related_entry_ids: string[] | null;
  referenced_by_outcome_ids: string[] | null;
  created_at: string;
}

function rowToEntry(row: KnowledgeRow): KnowledgeEntry {
  return {
    id: row.id,
    type: row.type as KnowledgeEntryType,
    origin: row.origin as KnowledgeOrigin,
    title: row.title,
    summary: row.summary ?? '',
    content: row.content ?? undefined,
    sourceIdeaId: row.idea_id ?? undefined,
    sourceVentureId: row.venture_id ?? undefined,
    contributingAgent: (row.contributing_agent ?? undefined) as any,
    citations: (row.citations ?? undefined) as any,
    relatedEntryIds: row.related_entry_ids ?? undefined,
    referencedByOutcomeIds: row.referenced_by_outcome_ids ?? undefined,
    confidence: row.confidence ?? undefined,
    createdAt: row.created_at,
  };
}

async function fetchFromDb(filters: {
  ventureId?: string;
  ideaId?: string;
}): Promise<KnowledgeEntry[]> {
  let q = supabase.from('knowledge_entries').select('*');

  if (isUuid(filters.ventureId)) {
    q = q.eq('venture_id', filters.ventureId);
  } else if (isUuid(filters.ideaId)) {
    q = q.eq('idea_id', filters.ideaId);
  }

  const { data, error } = await q.order('created_at', {
    ascending: false,
  });
  if (error) throw error;

  return (data ?? []).map((r) => rowToEntry(r as KnowledgeRow));
}

async function fetchFromMock(): Promise<KnowledgeEntry[]> {
  return [...knowledgeEntries, ...targetedResearchReports];
}

/* ------------------------------------------------------------
   useKnowledge — dual-mode.

   · ventureId (UUID) set  → Supabase query
   · ideaId    (UUID) set  → Supabase query
   · neither               → mock data (Library main shell)

   The query key includes the mode + scope so switching between
   a venture-scoped view and the Library doesn't cache-collide.
   ------------------------------------------------------------ */
export function useKnowledge(options: UseKnowledgeOptions = {}) {
  const hasDbScope =
    isUuid(options.ventureId) || isUuid(options.ideaId);

  const query = useQuery({
    queryKey: [
      'knowledge',
      hasDbScope ? 'db' : 'mock',
      options.ventureId ?? null,
      options.ideaId ?? null,
    ],
    queryFn: () =>
      hasDbScope
        ? fetchFromDb({
            ventureId: options.ventureId,
            ideaId: options.ideaId,
          })
        : fetchFromMock(),
    staleTime: 30_000,
  });

  const filtered = (query.data ?? []).filter((entry) => {
    if (options.types && !options.types.includes(entry.type)) return false;
    if (options.origins && !options.origins.includes(entry.origin))
      return false;
    return true;
  });

  return {
    ...query,
    data: { data: filtered },
    /** Total unfiltered count — useful for filter pills. */
    totalCount: query.data?.length ?? 0,
  };
}

/** Lookup helper used by ConnectedWeb + DecisionRow. */
export function findKnowledgeById(
  all: KnowledgeEntry[],
  ids: string[] | undefined
): KnowledgeEntry[] {
  if (!ids || ids.length === 0) return [];
  return ids
    .map((id) => all.find((e) => e.id === id))
    .filter((e): e is KnowledgeEntry => !!e);
}
