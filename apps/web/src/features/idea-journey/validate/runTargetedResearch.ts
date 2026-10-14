import { supabase } from '@/lib/supabase';
import { getIdeaAgent } from '@/features/idea-journey/agent';
import type {
  ResearchEntry,
  ResearchThreadKind,
  StructuredIdeaCard,
} from '@/lib/types';

function kindToType(kind: ResearchThreadKind): string {
  switch (kind) {
    case 'customer':
      return 'customer_insight';
    case 'competitor':
      return 'competitive_analysis';
    case 'market':
    default:
      return 'market_analysis';
  }
}

export interface TargetedResearchInput {
  ideaId: string;
  workspaceId: string;
  userId: string;
  kind: ResearchThreadKind;
  query: string;
  rawCapture: string;
  structured: StructuredIdeaCard;
  priorEntries: ResearchEntry[];
}

/**
 * runTargetedResearch — the real generator behind "Ask for more".
 *
 * Calls the same agent the initial journey uses, persists the memo
 * to knowledge_entries with origin = 'idea_research', and returns
 * the DB row so the caller's local entry has the same UUID.
 */
export async function runTargetedResearch(
  input: TargetedResearchInput,
): Promise<ResearchEntry> {
  const out = await getIdeaAgent().researchThread({
    kind: input.kind,
    rawCapture: input.rawCapture,
    structured: input.structured,
    priorEntriesSummary: input.priorEntries.map((e) => ({
      kind: e.kind,
      title: e.title,
      summary: e.summary,
    })),
    founderPrompt: input.query,
  });

  const sections = out.entry.sections ?? [];
  const entry: ResearchEntry = {
    id: `re_targeted_${input.kind}_${Date.now().toString(36)}`,
    kind: input.kind,
    title: out.entry.title,
    summary: out.entry.summary,
    sections,
    confidence: out.entry.confidence,
    founderPrompt: input.query,
    createdAt: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from('knowledge_entries')
    .insert({
      user_id: input.userId,
      workspace_id: input.workspaceId,
      idea_id: input.ideaId,
      venture_id: null,
      type: kindToType(input.kind),
      origin: 'idea_research',
      title: entry.title,
      summary: entry.summary,
      content: JSON.stringify(sections),
      confidence: entry.confidence,
      contributing_agent: 'research',
    })
    .select()
    .single();

  if (error || !inserted) {
    console.warn('[targeted research] insert failed', error?.message);
    return entry;
  }

  return {
    ...entry,
    id: inserted.id,
    createdAt: inserted.created_at,
  };
}
