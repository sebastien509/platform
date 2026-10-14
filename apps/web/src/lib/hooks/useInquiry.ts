import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface InquiryResult {
  entryId: string;
  title: string;
  summary: string;
  body: string;
  citedEntryIds: string[];
}

export interface InquiryInput {
  query: string;
  ventureId?: string;
  workspaceId?: string;
}

/**
 * useInquiry — the search agent.
 *
 * Sends a natural-language question to venture-agent with the
 * venture's knowledge context. The LLM produces a synthesized
 * answer, which is persisted as a knowledge_entries row
 * (type: 'synthesized_answer', origin: 'inquiry') and returned.
 *
 * On success, invalidates the knowledge query so the new entry
 * appears in the grid immediately.
 */
export function useInquiry() {
  const qc = useQueryClient();
  return useMutation<InquiryResult, Error, InquiryInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke(
        'venture-agent',
        {
          body: {
            method: 'inquiry',
            input,
          },
        }
      );
      if (error) throw new Error(error.message);
      const out = data?.output;
      if (out?.error) throw new Error(out.message ?? out.error);
      return out as InquiryResult;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ['knowledge', 'db', variables.ventureId ?? null, null],
      });
    },
  });
}
