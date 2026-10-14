// ============================================================
// workspace-invite — membership management.
//
// Methods:
//   list    — members + pending invites for a workspace
//   create  — mint an invite + send the email via Resend
//   revoke  — revoke a pending invite
//   accept  — create a membership from an invite token (idempotent)
//   remove  — remove a member
//   set-role — change a member's role
// ============================================================
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM =
  Deno.env.get('RESEND_FROM') ?? 'IV Platform <onboarding@resend.dev>';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function token(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'inv_';
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

const RANK: Record<string, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

async function getRole(
  db: ReturnType<typeof admin>,
  userId: string,
  workspaceId: string,
): Promise<string | null> {
  const { data } = await db
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  return data?.role ?? null;
}

/* ── list ── */
async function handleList(userId: string, workspaceId: string) {
  const role = await getRole(admin(), userId, workspaceId);
  if (!role) return { error: 'not_a_member' };
  const db = admin();
  const { data: members } = await db
    .from('memberships')
    .select('id, user_id, role, joined_at, users:user_id(email, name)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });
  const { data: invites } = await db
    .from('workspace_invites')
    .select('id, email, role, invited_by, token, expires_at, created_at')
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  return {
    ok: true,
    role,
    members: (members ?? []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      email: m.users?.email ?? '',
      name: m.users?.name ?? null,
    })),
    invites: (invites ?? []).map((i: any) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      expiresAt: i.expires_at,
      createdAt: i.created_at,
      inviteUrl: `${APP_URL}/invite/${i.token}`,
    })),
  };
}

/* ── create + send email via Resend ── */
async function handleCreate(
  userId: string,
  input: { workspaceId: string; email: string; role: 'admin' | 'member' | 'viewer' },
) {
  const email = String(input.email ?? '').trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return { error: 'invalid_email', message: 'Enter a valid email.' };
  }
  if (!['admin', 'member', 'viewer'].includes(input.role)) {
    return { error: 'invalid_role', message: 'Role must be admin, member, or viewer.' };
  }

  const db = admin();
  const role = await getRole(db, userId, input.workspaceId);
  if (!role || RANK[role] < RANK.admin) {
    return { error: 'forbidden', message: 'Only owners and admins can invite.' };
  }

  /* Already a member? */
  const { data: existingUser } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingUser) {
    const { data: existingMembership } = await db
      .from('memberships')
      .select('id')
      .eq('workspace_id', input.workspaceId)
      .eq('user_id', existingUser.id)
      .maybeSingle();
    if (existingMembership) {
      return { error: 'already_member', message: 'That email is already on the team.' };
    }
  }

  /* Revoke any prior pending invite for the same email */
  await db
    .from('workspace_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('workspace_id', input.workspaceId)
    .eq('email', email)
    .is('accepted_at', null)
    .is('revoked_at', null);

  const tok = token();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from('workspace_invites')
    .insert({
      workspace_id: input.workspaceId,
      email,
      role: input.role,
      invited_by: userId,
      token: tok,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return { error: 'insert_failed', message: error.message };

  const inviteUrl = `${APP_URL}/invite/${data.token}`;

  /* ── Send the email via Resend ── */
  let emailSent = false;
  let emailError: string | null = null;

  if (!RESEND_API_KEY) {
    emailError = 'resend_not_configured';
    console.warn('[workspace-invite] RESEND_API_KEY not set — skipping send');
  } else {
    try {
      /* Friendly context for the email body */
      const { data: inviter } = await db
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .maybeSingle();
      const { data: ws } = await db
        .from('workspaces')
        .select('name')
        .eq('id', input.workspaceId)
        .maybeSingle();

      const inviterName =
        inviter?.name ?? inviter?.email?.split('@')[0] ?? 'A teammate';
      const workspaceName = ws?.name ?? 'their workspace';

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [email],
          subject: `${inviterName} invited you to ${workspaceName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700;">You've been invited to IV</h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #4a4a4a;">
                <strong>${inviterName}</strong> added you to <strong>${workspaceName}</strong> as a ${input.role}.
              </p>
              <p style="margin: 0 0 24px;">
                <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Accept the invite
                </a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9a9a9a;">
                Or paste this link into your browser:<br/>
                <span style="color: #4a4a4a; word-break: break-all;">${inviteUrl}</span>
              </p>
              <p style="margin: 24px 0 0; font-size: 12px; color: #9a9a9a;">
                If you weren't expecting this, you can safely ignore it.
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        emailError = `Resend ${res.status}: ${text.slice(0, 300)}`;
        console.error('[workspace-invite] resend failed', emailError);
      } else {
        emailSent = true;
      }
    } catch (e) {
      emailError = e instanceof Error ? e.message : 'email send failed';
      console.error('[workspace-invite] resend threw', emailError);
    }
  }

  console.log('[workspace-invite] email result', {
    email,
    emailSent,
    emailError,
    inviteUrl,
  });

  return {
    ok: true,
    invite: {
      id: data.id,
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expires_at,
      inviteUrl,
    },
    emailSent,
    emailError,
  };
}

/* ── revoke ── */
async function handleRevoke(userId: string, inviteId: string) {
  const db = admin();
  const { data: invite } = await db
    .from('workspace_invites')
    .select('workspace_id')
    .eq('id', inviteId)
    .maybeSingle();
  if (!invite) return { error: 'invite_not_found' };
  const role = await getRole(db, userId, invite.workspace_id);
  if (!role || RANK[role] < RANK.admin) return { error: 'forbidden' };
  await db
    .from('workspace_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId);
  return { ok: true };
}

/* ── accept — idempotent ── */
async function handleAccept(userId: string, tok: string) {
  const db = admin();
  const { data: invite } = await db
    .from('workspace_invites')
    .select('*')
    .eq('token', tok)
    .maybeSingle();

  if (!invite) return { error: 'invalid_token', message: 'This invite link is not valid.' };
  if (invite.revoked_at) return { error: 'revoked', message: 'This invite was revoked.' };
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'expired', message: 'This invite has expired. Ask for a new one.' };
  }

  /* Email match — the signed-in user must match the invite's email. */
  const { data: me } = await db
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  const emailMatches =
    me?.email && me.email.toLowerCase() === invite.email.toLowerCase();

  /* Self-heal: if the users row is missing (signup trigger failed),
   * we can't match. Insert it from auth.users metadata. */
  if (!me) {
    const { data: au } = await db.auth.admin.getUserById(userId);
    if (!au?.user) return { error: 'no_auth_user' };
    if (au.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return {
        error: 'email_mismatch',
        message: `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      };
    }
    await db.from('users').insert({
      id: userId,
      email: au.user.email,
      name:
        (au.user.user_metadata?.name as string | undefined) ??
        (au.user.user_metadata?.full_name as string | undefined) ??
        au.user.email.split('@')[0],
    });
  } else if (!emailMatches) {
    return {
      error: 'email_mismatch',
      message: `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
    };
  }

  /* Idempotent insert — StrictMode double-fires this. */
  const { error: insErr } = await db
    .from('memberships')
    .upsert(
      {
        user_id: userId,
        workspace_id: invite.workspace_id,
        role: invite.role,
        joined_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,workspace_id',
        ignoreDuplicates: true,
      },
    );

  console.log('[workspace-invite] membership accepted', {
    userId,
    workspaceId: invite.workspace_id,
    role: invite.role,
    inserted: !insErr,
  });

  if (insErr && (insErr as any).code !== '23505') {
    return { error: 'insert_failed', message: insErr.message };
  }

  /* Mark invite accepted (only if not already) */
  if (!invite.accepted_at) {
    await db
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  return {
    ok: true,
    workspaceId: invite.workspace_id,
    role: invite.role,
  };
}

/* ── remove ── */
async function handleRemove(userId: string, membershipId: string) {
  const db = admin();
  const { data: target } = await db
    .from('memberships')
    .select('id, workspace_id, user_id, role')
    .eq('id', membershipId)
    .maybeSingle();
  if (!target) return { error: 'not_found' };
  const role = await getRole(db, userId, target.workspace_id);
  if (!role || RANK[role] < RANK.admin) return { error: 'forbidden' };
  if (target.role === 'owner') return { error: 'cannot_remove_owner' };
  if (target.user_id === userId) return { error: 'cannot_remove_self' };
  await db.from('memberships').delete().eq('id', membershipId);
  return { ok: true };
}

/* ── set-role ── */
async function handleSetRole(
  userId: string,
  input: { membershipId: string; role: 'admin' | 'member' | 'viewer' },
) {
  const db = admin();
  const { data: target } = await db
    .from('memberships')
    .select('id, workspace_id, role')
    .eq('id', input.membershipId)
    .maybeSingle();
  if (!target) return { error: 'not_found' };
  if (target.role === 'owner') return { error: 'cannot_change_owner' };
  if (!['admin', 'member', 'viewer'].includes(input.role)) {
    return { error: 'invalid_role' };
  }
  const role = await getRole(db, userId, target.workspace_id);
  if (role !== 'owner') {
    return { error: 'forbidden', message: 'Only the owner can change roles.' };
  }
  await db
    .from('memberships')
    .update({ role: input.role })
    .eq('id', input.membershipId);

  /* Emit the role.changed event — the fan-out trigger turns it
   * into a notification for the affected user. Service-role
   * insert bypasses RLS, so we pass the actor explicitly. */
  await db.from('venture_events').insert({
    workspace_id: target.workspace_id,
    actor_id: userId,
    event_type: 'role.changed',
    target_type: 'membership',
    target_id: input.membershipId,
    payload: {
      title: `Your role changed to ${input.role}`,
      icon_type: 'warning',
      recipient_ids: [target.user_id],
    },
  });

  return { ok: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'not authenticated' }), {
      status: 401,
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

  try {
    let output: any;
    switch (method) {
      case 'list':
        output = await handleList(userId, input?.workspaceId);
        break;
      case 'create':
        output = await handleCreate(userId, input ?? {});
        break;
      case 'revoke':
        output = await handleRevoke(userId, input?.inviteId);
        break;
      case 'accept':
        output = await handleAccept(userId, input?.token);
        break;
      case 'remove':
        output = await handleRemove(userId, input?.membershipId);
        break;
      case 'set-role':
        output = await handleSetRole(userId, input ?? {});
        break;
      default:
        output = { error: `unknown method: ${method}` };
    }
    return new Response(JSON.stringify({ output }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    console.error('[workspace-invite]', method, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
