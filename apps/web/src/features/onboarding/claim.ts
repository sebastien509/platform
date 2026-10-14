import { supabase } from '@/lib/supabase';

const HANDOFFS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handoffs`;

export interface ClaimResult {
  handoffId: string;
  workspaceId?: string | null;
  ideaId?: string;
  status: 'claimed';
  /** The founder's raw idea text. Present after claim. */
  content?: string;
  error?: string;
  message?: string;
}

export async function claimHandoff(handoffId: string): Promise<ClaimResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('not_authenticated');

  const res = await fetch(HANDOFFS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      method: 'claim',
      input: { handoffId },
    }),
  });

  const data = (await res.json()) as ClaimResult;

  if (!res.ok || data.error) {
    throw new Error(data.message ?? data.error ?? 'claim_failed');
  }

  return data;
}

/**
 * Fallback: if the backend couldn't persist the Idea (e.g. the
 * ideas table doesn't exist yet), write it client-side into the
 * founder's workspace.
 */
export async function createIdeaFromHandoff(
  workspaceId: string,
  rawInput: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      workspace_id: workspaceId,
      raw_input: rawInput,
      status: 'captured',
      source: 'landing',
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[onboarding] client idea insert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}
