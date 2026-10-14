// ============================================================
// share-guest — public edge function for share links.
//
// Handles two methods:
//   · read    — validate token, return { share, comments }
//   · comment — validate token, insert comment, return the row
//
// Uses service_role because RLS intentionally blocks public
// reads on share_links and comments. The token is the credential.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

interface ShareRow {
  id: string;
  output_id: string;
  venture_id: string | null;
  workspace_id: string | null;
  created_by: string | null;
  surface_id: string | null;
  label: string | null;
  snapshot: any;
  comments_enabled: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

async function loadShare(token: string): Promise<ShareRow | null> {
  const db = admin();
  const { data, error } = await db
    .from('share_links')
    .select('*')
    .eq('id', token)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as ShareRow;

  /* Expired or revoked — treat as missing. */
  if (row.revoked_at) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;

  return row;
}

async function handleRead(input: { token: string }) {
  const share = await loadShare(input.token);
  if (!share) {
    return {
      error: 'not_found',
      message: 'This link is invalid, expired, or was revoked.',
    };
  }

  const db = admin();
  const { data: comments } = await db
    .from('comments')
    .select('id, output_id, author_id, author_name, body, section_id, section_label, resolved, created_at, share_link_id')
    .eq('output_id', share.output_id)
    .order('created_at', { ascending: true });

  return { share, comments: comments ?? [] };
}

async function handleComment(input: {
  token: string;
  body: string;
  sectionId?: string;
  sectionLabel?: string;
  authorName?: string;
}) {
  const share = await loadShare(input.token);
  if (!share) {
    return {
      error: 'not_found',
      message: 'This link is invalid, expired, or was revoked.',
    };
  }
  if (!share.comments_enabled) {
    return {
      error: 'comments_disabled',
      message: 'Comments are disabled on this share.',
    };
  }

  const body = String(input.body ?? '').trim().slice(0, 5000);
  if (!body) {
    return { error: 'empty', message: 'Comment body is required.' };
  }

  const authorName = String(input.authorName ?? 'Guest').trim().slice(0, 80);

  const db = admin();
  const { data, error } = await db
    .from('comments')
    .insert({
      output_id: share.output_id,
      author_id: null,             // guest
      author_name: authorName,
      body,
      section_id: input.sectionId ?? null,
      section_label: input.sectionLabel ?? null,
      share_link_id: share.id,
    })
    .select()
    .single();

  if (error) return { error: 'insert_failed', message: error.message };

  return { comment: data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
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
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { method, input } = body;
  if (!method || !input?.token) {
    return new Response(JSON.stringify({ error: 'method + token required' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    let output: any;
    if (method === 'read') {
      output = await handleRead(input);
    } else if (method === 'comment') {
      output = await handleComment(input);
    } else {
      return new Response(
        JSON.stringify({ error: `unknown method: ${method}` }),
        {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(JSON.stringify({ output }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    console.error('[share-guest]', method, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
