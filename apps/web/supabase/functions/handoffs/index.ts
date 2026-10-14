// ============================================================
// handoffs — landing → app handoff broker
//
// Three methods:
//   create  — no auth. Mints a handoff id, stores the raw founder
//             input, returns { handoffId, expiresAt }.
//   preview — no auth. Returns the id/type/status/expiry. Never
//             exposes the raw content. Used by the landing to show
//             a "Resume your idea" prompt if the founder comes back.
//   claim   — auth required. Consumes the handoff, resolves the
//             founder's workspace, creates the first Idea, marks
//             the handoff claimed. Idempotent — calling twice
//             returns the same ideaId.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HANDOFF_TTL_HOURS = 48;
const MAX_CONTENT_LENGTH = 2000;

function genId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'hd_';
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

/* ────────── create ────────── */

async function handleCreate(input: any) {
  const content = String(input?.content ?? '').trim();
  if (content.length < 3) {
    return { error: 'invalid_content', message: 'Please enter an idea before continuing.' };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: 'content_too_long', message: 'Idea is too long.' };
  }

  const id = genId();
  const expiresAt = new Date(
    Date.now() + HANDOFF_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const db = admin();
  const { error } = await db.from('handoffs').insert({
    id,
    type: input.type ?? 'idea',
    payload: { content },
    source: input.source ?? null,
    campaign: input.campaign ?? null,
    referrer: input.referrer ?? null,
    expires_at: expiresAt,
  });

  if (error) return { error: 'insert_failed', message: error.message };

  console.log('[handoffs] created', { id, source: input.source });
  return { handoffId: id, expiresAt };
}

/* ────────── preview ────────── */

async function handlePreview(handoffId: string) {
  if (!handoffId) return { error: 'missing_id' };

  const db = admin();
  const { data, error } = await db
    .from('handoffs')
    .select('id, type, status, expires_at, created_at')
    .eq('id', handoffId)
    .maybeSingle();

  if (error) return { error: 'lookup_failed', message: error.message };
  if (!data) return { error: 'not_found', message: 'Handoff not found.' };

  if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
    return { error: 'expired', message: 'This handoff has expired.' };
  }

  return {
    id: data.id,
    type: data.type,
    status: data.status,
    expiresAt: data.expires_at,
  };
}

/* ────────── get ────────── */

/**
 * Public fetch — returns the payload content along with metadata.
 * Safe to expose: the handoff ID is a 20-char random token, and the
 * payload contains only the founder's own raw input. Used by the
 * draft journey at /draft/:handoffId.
 */
async function handleGet(handoffId: string) {
  if (!handoffId) return { error: 'missing_id' };

  const db = admin();
  const { data, error } = await db
    .from('handoffs')
    .select('id, type, status, payload, expires_at, created_at')
    .eq('id', handoffId)
    .maybeSingle();

  if (error) return { error: 'lookup_failed', message: error.message };
  if (!data) return { error: 'not_found', message: 'Handoff not found.' };

  if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
    return { error: 'expired', message: 'This handoff has expired.' };
  }

  return {
    id: data.id,
    type: data.type,
    status: data.status,
    content: (data.payload as any)?.content ?? null,
    expiresAt: data.expires_at,
  };
}

/* ────────── claim ────────── */

async function handleClaim(userId: string, handoffId: string) {
  if (!handoffId) return { error: 'missing_id' };

  const db = admin();

  // Fetch the handoff
  const { data: handoff, error: fetchErr } = await db
    .from('handoffs')
    .select('*')
    .eq('id', handoffId)
    .maybeSingle();

  if (fetchErr) return { error: 'lookup_failed', message: fetchErr.message };
  if (!handoff) return { error: 'not_found', message: 'Handoff not found.' };

  // Idempotency — return the same content on re-claim
  if (handoff.status === 'claimed') {
    if (handoff.claimed_by_user_id !== userId) {
      return {
        error: 'already_claimed_by_other',
        message: 'This idea was already claimed by another founder.',
      };
    }
    return {
      handoffId: handoff.id,
      content: (handoff.payload as any)?.content ?? '',
      status: 'claimed',
    };
  }

  // Expiry check
  if (
    handoff.status === 'expired' ||
    new Date(handoff.expires_at) < new Date()
  ) {
    return { error: 'expired', message: 'This handoff has expired.' };
  }

  // Resolve the founder's workspace (for the record)
  const { data: membership } = await db
    .from('memberships')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  /* Mark the handoff claimed. The CLIENT persists the idea row
   * via pushIdeaToDb — same path as the normal graduation flow.
   * This keeps the schema alignment in one place (usePushIdea /
   * pushIdeaToDb) rather than duplicating it in the edge function. */
  await db
    .from('handoffs')
    .update({
      status: 'claimed',
      claimed_by_user_id: userId,
      claimed_workspace_id: membership?.workspace_id ?? null,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', handoffId);

  console.log('[handoffs] claimed (client will persist idea)', {
    handoffId,
    userId,
    workspaceId: membership?.workspace_id,
  });

  return {
    handoffId: handoff.id,
    content: (handoff.payload as any)?.content ?? '',
    workspaceId: membership?.workspace_id ?? null,
    status: 'claimed',
  };
}

/* ────────── server ────────── */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: { method?: string; input?: any };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { method, input } = body;

  try {
    let output: any;

    switch (method) {
      case 'create':
        output = await handleCreate(input ?? {});
        break;

      case 'preview':
        output = await handlePreview(input?.handoffId);
        break;

      case 'get':
        output = await handleGet(input?.handoffId);
        break;

      case 'claim': {
        const userId = await verifyAuth(req);
        if (!userId) {
          output = { error: 'not_authenticated', message: 'Sign in to claim this idea.' };
        } else {
          output = await handleClaim(userId, input?.handoffId);
        }
        break;
      }

      default:
        output = { error: `unknown_method`, message: `Unknown method: ${method}` };
    }

    const status = output?.error ? 400 : 200;
    return new Response(JSON.stringify(output), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[handoffs]', method, msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
