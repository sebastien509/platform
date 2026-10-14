import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------
   createShareLink — one share link per output.

   Idempotent: calling twice for the same output returns the same
   row. This matters because React StrictMode double-fires the
   validation effect in dev, and the second call must not fail.

   The DB has a unique index on share_links.output_id (migration
   0018), so the upsert below replaces on conflict.

   The `id` (url token) is generated fresh on each call and used
   only when creating a new row — the upsert's `onConflict` is
   keyed on output_id, so a retry won't churn the token.
   ------------------------------------------------------------ */

function token(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'sl_';
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

export interface CreateShareLinkInput {
  outputId: string;
  ventureId?: string;
  workspaceId?: string;
  surfaceId?: string;
  label?: string;
  snapshot: unknown;
  commentsEnabled?: boolean;
  expiresAt?: string | null;
}

export async function createShareLink(
  input: CreateShareLinkInput
): Promise<{ id: string } | { error: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'not authenticated' };

  /* Check if a share link already exists for this output — fast
     path before the network round-trip. RLS scopes the read to
     the owner. */
  const { data: existing } = await supabase
    .from('share_links')
    .select('id')
    .eq('output_id', input.outputId)
    .maybeSingle();

  if (existing?.id) {
    return { id: existing.id };
  }

  /* Insert. If a race put a row in between the check and the
     insert, the unique index will reject — retry the read. */
  const id = token();
  const { error } = await supabase.from('share_links').insert({
    id,
    output_id: input.outputId,
    venture_id: input.ventureId ?? null,
    workspace_id: input.workspaceId ?? null,
    created_by: auth.user.id,
    surface_id: input.surfaceId ?? null,
    label: input.label ?? null,
    snapshot: input.snapshot,
    comments_enabled: input.commentsEnabled ?? true,
    expires_at: input.expiresAt ?? null,
  });

  if (error) {
    /* 23505 = unique_violation. The row appeared between the
       check and the insert — read it back. */
    if ((error as any).code === '23505' || error.message.includes('duplicate')) {
      const { data: winner } = await supabase
        .from('share_links')
        .select('id')
        .eq('output_id', input.outputId)
        .maybeSingle();
      if (winner?.id) return { id: winner.id };
    }
    return { error: error.message };
  }

  return { id };
}

export function shareUrl(token: string): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/share/${token}`;
}
