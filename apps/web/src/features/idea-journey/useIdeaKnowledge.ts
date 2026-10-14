import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ResearchEntry, ResearchThreadKind, ResearchSection } from '@/lib/types';

/**
 * useIdeaKnowledge — the source of truth for research on an idea.
 *
 * The research op writes each memo into `knowledge_entries` with
 * origin = 'idea_research' and idea_id set. The Validate page reads
 * from here — not from the local journey store, which only holds
 * the run-in-flight state.
 */
export function useIdeaKnowledge(ideaId: string | null | undefined) {
  return useQuery<ResearchEntry[]>({
    queryKey: ['idea-knowledge', ideaId ?? null],
    enabled: Boolean(ideaId),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('origin', 'idea_research')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToResearchEntry);
    },
    staleTime: 15_000,
  });
}

/* ── Type mapping ── */

function mapKind(type: string): ResearchThreadKind {
  switch (type) {
    case 'customer_insight':
    case 'customer':
      return 'customer';
    case 'competitive_analysis':
    case 'competitor':
      return 'competitor';
    case 'market_analysis':
    case 'market':
      return 'market';
    default:
      return 'market';
  }
}

function parseSections(content: unknown): ResearchSection[] {
  if (!content) return [];
  if (Array.isArray(content)) return content as ResearchSection[];
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed as ResearchSection[];
    } catch {
      /* Content isn't JSON — treat as a single narrative section. */
      return [
        {
          type: 'narrative',
          narrative: {
            heading: 'Research notes',
            paragraphs: [content],
          },
        } as unknown as ResearchSection,
      ];
    }
  }
  return [];
}

function rowToResearchEntry(row: any): ResearchEntry {
  return {
    id: row.id,
    kind: mapKind(row.type),
    title: row.title ?? 'Untitled memo',
    summary: row.summary ?? '',
    sections: parseSections(row.content),
    confidence: typeof row.confidence === 'number' ? row.confidence : 60,
    createdAt: row.created_at,
  };
}
