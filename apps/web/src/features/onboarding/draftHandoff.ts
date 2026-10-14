const HANDOFFS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handoffs`;

export interface HandoffPreview {
  id: string;
  type: 'idea' | string;
  status: 'pending' | 'claimed' | 'expired';
  content?: string;
  expiresAt?: string;
}

/**
 * Fetch the handoff preview — used by the draft route to seed the
 * journey with the founder's raw input. No auth required.
 */
export async function fetchHandoff(handoffId: string): Promise<HandoffPreview> {
  const res = await fetch(HANDOFFS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'get', input: { handoffId } }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.message ?? data.error ?? 'handoff_fetch_failed');
  }
  return data;
}
