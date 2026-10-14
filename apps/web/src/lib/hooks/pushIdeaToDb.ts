import { supabase } from '@/lib/supabase';
import type { IdeaRow } from './useIdeas';

/**
 * pushIdeaToDb — the canonical client-side idea insert.
 *
 * Mirrors usePushIdea's shape so the handoff flow and the normal
 * graduation flow write the same columns.
 */
export async function pushIdeaToDb(payload: {
  title: string;
  structured: Record<string, unknown>;
  capture_payload: Record<string, unknown>;
  clean_payload: Record<string, unknown>;
  validation: Record<string, unknown>;
  /** Defaults to 'validate' — matches usePushIdea's graduation point. */
  stage?: string;
}): Promise<IdeaRow> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: auth.user.id,
      title: payload.title.trim() || 'Untitled idea',
      stage: payload.stage ?? 'validate',
      structured: payload.structured,
      capture_payload: payload.capture_payload,
      clean_payload: payload.clean_payload,
      validation: payload.validation,
    })
    .select()
    .single();

  if (error) throw error;
  return data as IdeaRow;
}
