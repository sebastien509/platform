import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  StructuredIdeaCard,
  ResearchEntry,
  ValidationState,
  ResearchThreadKind,
} from '@/lib/types';

export interface CreateVentureFromIdeaInput {
  ideaId: string;
  workspaceId: string;
  name: string;
  description?: string;
  structured: StructuredIdeaCard;
  researchEntries: ResearchEntry[];
  validation: ValidationState;
}

export interface CreatedVentureRow {
  id: string;
  workspace_id: string;
  source_idea_id: string | null;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

/* ------------------------------------------------------------
   Map a research thread kind to a knowledge_entries.type.
   The DB enforces this via CHECK — see 0003_ventures_ideas.sql.
   ------------------------------------------------------------ */
function kindToType(kind: ResearchThreadKind): string {
  switch (kind) {
    case 'market':
      return 'market_analysis';
    case 'competitor':
      return 'competitive_analysis';
    case 'customer':
      return 'customer_insight';
    default:
      return 'research_report';
  }
}

/* ------------------------------------------------------------
   useCreateVentureFromIdea — the graduation write.

   Three steps, in order:
     1. Insert the venture row (with source_idea_id)
     2. Bulk-insert the research entries as knowledge_entries
     3. Patch the idea: stage → 'transitioned', record the venture id

   Step 1 is required. Steps 2 and 3 are best-effort — if they
   fail, the venture still exists, and the founder can re-run.
   The journey stays available locally for recovery.

   Future: wrap this in a Postgres RPC for true atomicity. For
   now, client-side sequencing matches the existing useCreateVenture
   pattern.
   ------------------------------------------------------------ */
export function useCreateVentureFromIdea() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateVentureFromIdeaInput
    ): Promise<CreatedVentureRow> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      /* ─── 1. Venture row ─── */
      const { data: venture, error: vErr } = await supabase
        .from('ventures')
        .insert({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          workspace_id: input.workspaceId,
          source_idea_id: input.ideaId,
          created_by: auth.user.id,
          status: 'validating',
          health: {
            strategy: 15,
            product: 0,
            engineering: 0,
            gtm: 5,
            marketing: 0,
            content: 0,
            sales: 0,
            growth: 0,
            analytics: 0,
            knowledge: 20,
            outcomes: 0,
          },
        })
        .select()
        .single();
      if (vErr) throw vErr;
      if (!venture) throw new Error('Venture was not created');

      /* ─── 2. Knowledge entries (best-effort) ─── */
      if (input.researchEntries.length > 0) {
        const entries = input.researchEntries.map((e) => ({
          user_id: auth.user.id,
          workspace_id: input.workspaceId,
          idea_id: input.ideaId,
          venture_id: venture.id,
          type: kindToType(e.kind),
          origin: 'idea_research',
          title: e.title,
          summary: e.summary,
          content: JSON.stringify(e.sections ?? []),
          confidence: e.confidence,
          contributing_agent: 'research',
        }));

        const { error: kErr } = await supabase
          .from('knowledge_entries')
          .insert(entries);

        if (kErr) {
          /* Venture is the durable artifact. Log the memo failure —
             the founder can still enter the venture, and we can
             recover the memos from the local journey later. */
          console.warn('[transition] knowledge insert failed', kErr);
        }
      }

      /* ─── 3. Patch the idea (best-effort) ─── */
      const { error: iErr } = await supabase
        .from('ideas')
        .update({
          stage: 'transitioned',
          validation: {
            ...(input.validation as unknown as Record<string, unknown>),
            decision: 'continue',
            decidedAt: new Date().toISOString(),
            ventureId: venture.id,
          },
        })
        .eq('id', input.ideaId);

      if (iErr) {
        console.warn('[transition] idea patch failed', iErr);
      }

      return venture as CreatedVentureRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventures'] });
      qc.invalidateQueries({ queryKey: ['ideas'] });
      qc.invalidateQueries({ queryKey: ['idea'] });
      qc.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}
