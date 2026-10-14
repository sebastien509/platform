import { supabase } from '@/lib/supabase';
import type { ShareSnapshot } from './types';

/* ============================================================
   Guest share client — talks to the `share-guest` edge function.

   Used by the public /share/:token page (guest viewers) and by
   the founder's share-link panel (to verify a link works before
   sending it).
   ============================================================ */

export interface GuestShare {
  id: string;
  output_id: string;
  venture_id: string | null;
  workspace_id: string | null;
  created_by: string | null;
  surface_id: string | null;
  label: string | null;
  snapshot: ShareSnapshot;
  comments_enabled: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface GuestComment {
  id: string;
  output_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  section_id: string | null;
  section_label: string | null;
  resolved: boolean;
  created_at: string;
  share_link_id: string | null;
}

export async function readSharedOutput(token: string): Promise<{
  share: GuestShare | null;
  comments: GuestComment[];
  error: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('share-guest', {
    body: { method: 'read', input: { token } },
  });

  if (error) {
    return { share: null, comments: [], error: error.message };
  }

  const out = data?.output;
  if (out?.error) {
    return { share: null, comments: [], error: out.message ?? out.error };
  }

  return {
    share: out.share ?? null,
    comments: out.comments ?? [],
    error: null,
  };
}

export async function writeGuestComment(input: {
  token: string;
  body: string;
  sectionId?: string;
  sectionLabel?: string;
  authorName?: string;
}): Promise<{ comment: GuestComment | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('share-guest', {
    body: { method: 'comment', input },
  });

  if (error) return { comment: null, error: error.message };

  const out = data?.output;
  if (out?.error) return { comment: null, error: out.message ?? out.error };

  return { comment: out.comment ?? null, error: null };
}
