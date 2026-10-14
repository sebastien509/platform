// ============================================================
// connector-execute — one edge function, every provider.
//
// Handlers: Gmail send, GitHub create-repo, Notion create-page,
//           Slack post-message, Calendar create-event.
//
// Every execute call refreshes the provider token if needed.
// Access tokens expire (Google: 1h, GitHub: 1h) — we never trust
// the stored token without checking expiry first.
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

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
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

async function fetchT(
  url: string,
  init: RequestInit = {},
  ms = 12_000
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function log(step: string, extra?: unknown) {
  try {
    console.log(
      `[connector-execute] ${step}`,
      extra ? JSON.stringify(extra) : ''
    );
  } catch {
    console.log(`[connector-execute] ${step}`);
  }
}

// ============================================================
// Token refresh — Google + GitHub
// ============================================================

/** Refresh a Google access token (Gmail, Calendar). */
async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID');
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials missing');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetchT(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    },
    12_000
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Google token refresh failed (${res.status}): ${text.slice(0, 300)}`
    );
  }
  const json = await res.json();
  return {
    access_token: json.access_token,
    expires_in: json.expires_in ?? 3600,
  };
}

// ============================================================
// GitHub App JWT — Web Crypto, no external deps
// ============================================================

function normalisePem(pem: string): string {
  return pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const pkcs1Len = pkcs1.length;
  const contentLen = pkcs1Len + 22;
  const totalLen = contentLen + 4;
  const out = new Uint8Array(totalLen);
  let i = 0;
  out[i++] = 0x30; out[i++] = 0x82;
  out[i++] = (contentLen >> 8) & 0xff;
  out[i++] = contentLen & 0xff;
  out[i++] = 0x02; out[i++] = 0x01; out[i++] = 0x00;
  const algo = [
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7,
    0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ];
  for (const b of algo) out[i++] = b;
  out[i++] = 0x04; out[i++] = 0x82;
  out[i++] = (pkcs1Len >> 8) & 0xff;
  out[i++] = pkcs1Len & 0xff;
  out.set(pkcs1, i);
  return out;
}

function pemToPkcs8(pem: string): Uint8Array {
  const clean = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const bytes = b64ToBytes(clean);
  if (pem.includes('BEGIN RSA PRIVATE KEY')) return pkcs1ToPkcs8(bytes);
  return bytes;
}

function b64url(input: Uint8Array | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signAppJwt(appId: string, pem: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(normalisePem(pem)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })
  );
  const data = new TextEncoder().encode(`${h}.${p}`);
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
  );
  return `${h}.${p}.${b64url(sig)}`;
}

async function refreshGithubToken(input: {
  installationId: string;
}): Promise<string> {
  const appId = Deno.env.get('GITHUB_APP_ID');
  const pem = Deno.env.get('GITHUB_PRIVATE_KEY');
  if (!appId || !pem) throw new Error('GitHub App credentials missing');

  const jwt = await signAppJwt(appId, pem);
  const res = await fetchT(
    `https://api.github.com/app/installations/${input.installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
    12_000
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub token refresh failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
  const json = await res.json();
  return json.token;
}

async function githubFetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    log(`github fetch attempt ${i + 1}`, { url });
    const res = await fetchT(url, init, 20_000);
    log(`github response ${res.status}`, { url });

    const retryAfter = res.headers.get('retry-after');
    const isRateLimit = res.status === 429 || (res.status === 403 && retryAfter);
    if (!isRateLimit) return res;

    const waitMs = retryAfter
      ? Math.min(parseInt(retryAfter, 10) * 1000, 15_000)
      : 2000 * (i + 1);
    log(`github rate limited — waiting ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
    last = res;
  }
  return last!;
}

// ============================================================
// Gmail send
// ============================================================

function base64urlGmail(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function buildRfc822(input: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.body,
  ];
  return lines.join('\r\n');
}

async function gmailSend(input: {
  accessToken: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ messageId: string }> {
  const raw = buildRfc822(input);
  const encoded = base64urlGmail(raw);
  const res = await fetchT(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    },
    20_000
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return { messageId: json.id ?? '' };
}

// ============================================================
// GitHub — create repo (template-generate for user accounts)
// ============================================================

async function githubCreateRepo(input: {
  accessToken: string;
  installationId?: string;
  accountLogin?: string;
  accountType?: string;
  params: {
    name: string;
    description?: string;
    private?: boolean;
    files?: Array<{ path: string; content: string }>;
    issues?: Array<{ title: string; body: string }>;
  };
}): Promise<{ repoUrl: string; fullName: string }> {
  const { params } = input;
  const accessToken = input.installationId
    ? await refreshGithubToken({ installationId: input.installationId })
    : input.accessToken;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  const accountType = input.accountType ?? 'User';
  const owner = input.accountLogin;

  log('github create-repo start', {
    name: params.name,
    accountType,
    owner,
  });

  const body = JSON.stringify({
    name: params.name,
    description: params.description ?? '',
    private: params.private ?? true,
    auto_init: false,
  });

  /* ──────────────────────────────────────────────────────────
     Attempt 1 — native endpoints
     Orgs: POST /orgs/{org}/repos        (accepts install tokens)
     User: POST /user/repos              (UAT-only historically;
                                          new repository_creation
                                          permission may unlock)
     ────────────────────────────────────────────────────────── */

  const nativeUrl =
    accountType === 'Organization' && owner
      ? `https://api.github.com/orgs/${owner}/repos`
      : 'https://api.github.com/user/repos';

  log('github native attempt', { url: nativeUrl });
  let createRes = await githubFetchWithRetry(nativeUrl, {
    method: 'POST',
    headers,
    body,
  });

  /* If native succeeds → done. */
  if (createRes.ok) {
    log('github native success', { status: createRes.status });
  } else {
    /* Native failed. Read the body so we can decide whether to
       fall back or surface. */
    const nativeErrText = await createRes.clone().text();
    log('github native failed', {
      status: createRes.status,
      body: nativeErrText.slice(0, 200),
    });

    /* Only fall back to template-generate when:
       (a) account is a User (personal), and
       (b) native returned 403 (permission / UAT-only rejection)
       Any other status — 401 bad credentials, 422 already exists,
       5xx — should surface as-is. */
    const shouldFallback =
      accountType !== 'Organization' &&
      createRes.status === 403;

    if (!shouldFallback) {
      throw new Error(
        `GitHub create-repo failed (${createRes.status}): ${nativeErrText.slice(0, 300)}`
      );
    }

    /* ──────────────────────────────────────────────────────
       Attempt 2 — template-generate fallback
       Requires GITHUB_TEMPLATE_OWNER + GITHUB_TEMPLATE_REPO.
       Works with installation tokens on any account.
       ────────────────────────────────────────────────────── */

    const templateOwner = Deno.env.get('GITHUB_TEMPLATE_OWNER');
    const templateRepo = Deno.env.get('GITHUB_TEMPLATE_REPO');

    if (!templateOwner || !templateRepo) {
      throw new Error(
        `GitHub rejected /user/repos with 403 (installation tokens can't create personal repos). ` +
        `Fallback not configured — set GITHUB_TEMPLATE_OWNER and GITHUB_TEMPLATE_REPO to a public template repo. ` +
        `Original error: ${nativeErrText.slice(0, 200)}`
      );
    }

    /* Preflight — verify the App can see the template. */
    log('github template preflight', {
      template: `${templateOwner}/${templateRepo}`,
    });
    const checkRes = await fetchT(
      `https://api.github.com/repos/${templateOwner}/${templateRepo}`,
      { headers },
      10_000
    );
    if (!checkRes.ok) {
      const body = await checkRes.text();
      throw new Error(
        `Native /user/repos rejected (403) and template ${templateOwner}/${templateRepo} not accessible (${checkRes.status}). ` +
        `Verify the App is installed on the template and it's marked as a template repo. ` +
        `Body: ${body.slice(0, 200)}`
      );
    }

    log('github template-generate attempt');
    createRes = await githubFetchWithRetry(
      `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner: owner ?? undefined,
          name: params.name,
          description: params.description ?? '',
          private: params.private ?? true,
          include_all_branches: false,
        }),
      }
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(
        `GitHub create-repo failed on both native and template paths. ` +
        `Template error (${createRes.status}): ${text.slice(0, 300)}`
      );
    }
    log('github template-generate success');
  }

  const repo = await createRes.json();
  const fullName = repo.full_name;
  const defaultBranch = repo.default_branch ?? 'main';

  log('github repo created', { fullName });

  /* Seed files via Contents API */
  const files = params.files ?? [];
  for (const f of files) {
    const encoded = btoa(unescape(encodeURIComponent(f.content)));
    const putRes = await fetchT(
      `https://api.github.com/repos/${fullName}/contents/${f.path}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Add ${f.path}`,
          content: encoded,
          branch: defaultBranch,
        }),
      },
      20_000
    );
    if (!putRes.ok) {
      log('github file failed', { path: f.path, status: putRes.status });
    }
  }

  /* Create issues */
  const issues = params.issues ?? [];
  for (const iss of issues) {
    await fetchT(
      `https://api.github.com/repos/${fullName}/issues`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: iss.title, body: iss.body }),
      },
      15_000
    ).catch(() => null);
  }

  return { repoUrl: repo.html_url, fullName };
}

// ============================================================
// Notion — create page
// ============================================================

async function notionCreatePage(input: {
  accessToken: string;
  params: { parent_page_id?: string; title: string; markdown: string };
}): Promise<{ pageUrl: string; pageId: string }> {
  const { accessToken, params } = input;
  const blocks: any[] = [];
  const lines = (params.markdown ?? '').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(2) } }],
        },
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(3) } }],
        },
      });
    } else if (trimmed.startsWith('- ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(2) } }],
        },
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: trimmed } }],
        },
      });
    }
    if (blocks.length >= 100) break;
  }

  let parentId = params.parent_page_id;
  if (!parentId || parentId === 'root') {
    const searchRes = await fetchT(
      'https://api.notion.com/v1/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { property: 'object', value: 'page' },
          page_size: 1,
        }),
      },
      15_000
    );
    if (!searchRes.ok) {
      throw new Error(`Notion search failed: ${await searchRes.text()}`);
    }
    const search = await searchRes.json();
    parentId = search.results?.[0]?.id;
    if (!parentId) throw new Error('No accessible Notion page to parent under');
  }

  const res = await fetchT(
    'https://api.notion.com/v1/pages',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: params.title } }],
          },
        },
        children: blocks.slice(0, 100),
      }),
    },
    20_000
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Notion create-page failed (${res.status}): ${text.slice(0, 300)}`
    );
  }
  const page = await res.json();
  return { pageUrl: page.url, pageId: page.id };
}

// ============================================================
// Slack — post message
// ============================================================

async function slackPostMessage(input: {
  accessToken: string;
  params: { channel: string; text: string };
}): Promise<{ ts: string; channel: string }> {
  const { accessToken, params } = input;
  const channel = params.channel || '#general';

  let channelId = channel;
  if (channel.startsWith('#')) {
    const listRes = await fetchT(
      'https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200',
      { headers: { Authorization: `Bearer ${accessToken}` } },
      15_000
    );
    if (listRes.ok) {
      const list = await listRes.json();
      const match = list.channels?.find(
        (c: any) => `#${c.name}` === channel || c.name === channel.slice(1)
      );
      if (match) channelId = match.id;
    }
  }

  const res = await fetchT(
    'https://slack.com/api/chat.postMessage',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel: channelId, text: params.text }),
    },
    15_000
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack post failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(`Slack error: ${json.error ?? 'unknown'}`);
  return { ts: json.ts, channel: json.channel };
}

// ============================================================
// Calendar — create event
// ============================================================

async function calendarCreateEvent(input: {
  accessToken: string;
  accountEmail?: string;
  params: {
    title: string;
    duration_minutes?: number;
    description?: string;
    attendees?: string[];
  };
}): Promise<{ eventUrl: string; eventId: string }> {
  const { accessToken, params } = input;
  const duration = params.duration_minutes ?? 30;
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const res = await fetchT(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.title,
        description: params.description ?? '',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: (params.attendees ?? []).map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `iv-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }),
    },
    20_000
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Calendar create failed (${res.status}): ${text.slice(0, 300)}`
    );
  }
  const event = await res.json();

  /* The API's htmlLink sometimes returns a truncated eid (it
     cuts the calendar email short). Construct the eid ourselves
     from event.id + the account email — that's exactly what
     Google's own "publish event" link produces. */
  const calendarId = input.accountEmail ?? 'primary';
  const rawEid = `${event.id} ${calendarId}`;
  const b64 = btoa(
    String.fromCharCode(...new TextEncoder().encode(rawEid))
  );
  const eid = b64.replace(/=+$/, ''); /* strip base64 padding */
  const eventUrl = `https://www.google.com/calendar/event?eid=${eid}`;

  log('calendar event url built', {
    eventId: event.id,
    calendarId,
    eidLen: eid.length,
  });

  return { eventUrl, eventId: event.id };
}

// ============================================================
// Vercel — deploy files (inline, no Git integration needed)
// ============================================================
async function vercelDeploy(input: {
  accessToken: string;
  params: {
    project_name?: string;
    files?: Array<{ path: string; content: string }>;
  };
}): Promise<{ deployUrl: string; deploymentId: string }> {
  const { accessToken, params } = input;
  const files = params.files ?? [];
  if (files.length === 0) {
    throw new Error('No files to deploy.');
  }

  /* Vercel /v13/deployments accepts inline files.
     Each file's content is plain UTF-8. */
  const encodedFiles = files.map((f) => ({
    file: f.path,
    data: f.content,
  }));

  const projectName =
    params.project_name ??
    `iv-${Date.now().toString(36)}`.toLowerCase();

  const payload = {
    name: projectName,
    files: encodedFiles,
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null,
    },
    target: 'production',
  };

  log('vercel deploy start', {
    projectName,
    fileCount: files.length,
  });

  const res = await fetchT(
    'https://api.vercel.com/v13/deployments',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    30_000
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Vercel deploy failed (${res.status}): ${text.slice(0, 300)}`
    );
  }

  const json = await res.json();
  const deployUrl = json.url
    ? `https://${json.url}`
    : json.alias?.[0]
    ? `https://${json.alias[0]}`
    : '';

  log('vercel deploy success', {
    id: json.id,
    url: deployUrl,
    readyState: json.readyState,
  });

  return {
    deployUrl,
    deploymentId: json.id,
  };
}

// ============================================================
// Dispatcher
// ============================================================

interface ExecuteInput {
  provider: string;
  action: string;
  opId?: string;
  threadId?: string;
  outputId?: string;
  payload: Record<string, unknown>;
}

const PROVIDER_ACTIONS: Record<string, Record<string, string>> = {
  gmail: { send: 'gmail.send' },
  github: { 'create-repo': 'github.create-repo' },
  notion: { 'create-page': 'notion.create-page' },
  slack: { 'post-message': 'slack.post-message' },
  calendar: { 'create-event': 'calendar.create-event' },
  vercel: { deploy: 'vercel.deploy' },
};

/** Google-family providers — same refresh flow. */
const GOOGLE_PROVIDERS = new Set(['gmail', 'calendar']);

/**
 * Resolve a usable access token for the given connector.
 * Google tokens expire every hour — always check expiry and
 * refresh when needed. GitHub tokens are refreshed per-call.
 */
async function resolveAccessToken(
  db: ReturnType<typeof admin>,
  connectorId: string,
  provider: string,
  storedToken: {
    access_token: string;
    refresh_token?: string | null;
    expires_at?: string | null;
  }
): Promise<string> {
  /* Only Google needs expiry-based refresh. Other providers
     either don't expire or are refreshed at the call site
     (GitHub). */
  if (!GOOGLE_PROVIDERS.has(provider)) {
    return storedToken.access_token;
  }

  const expiresAt = storedToken.expires_at
    ? new Date(storedToken.expires_at).getTime()
    : 0;
  const now = Date.now();
  /* Refresh if expired or expiring within 5 minutes. */
  const needsRefresh = !expiresAt || expiresAt - now < 5 * 60 * 1000;

  if (!needsRefresh) {
    log(`${provider} token still valid`, {
      minutesLeft: Math.round((expiresAt - now) / 60000),
    });
    return storedToken.access_token;
  }

  if (!storedToken.refresh_token) {
    throw new Error(
      `${provider} token expired and no refresh_token on file. Reconnect ${provider}.`
    );
  }

  log(`${provider} refreshing token`, {
    expiresAt: storedToken.expires_at ?? 'never',
  });

  const refreshed = await refreshGoogleToken(storedToken.refresh_token);

  /* Persist the new token + expiry so future calls reuse it. */
  const newExpiry = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  await db
    .from('connector_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiry,
    })
    .eq('connector_id', connectorId);

  log(`${provider} token refreshed`);
  return refreshed.access_token;
}

async function handleExecute(userId: string, input: ExecuteInput) {
  const actionMap = PROVIDER_ACTIONS[input.provider];
  if (!actionMap) {
    return { error: 'unsupported_provider', message: `Provider ${input.provider} has no execute actions.` };
  }
  const actionId = actionMap[input.action];
  if (!actionId) {
    return { error: 'unsupported_action', message: `Action ${input.action} not supported.` };
  }

  const db = admin();

  const { data: connector } = await db
    .from('connectors')
    .select('id, account_label, status')
    .eq('user_id', userId)
    .eq('provider', input.provider)
    .is('revoked_at', null)
    .maybeSingle();

  if (!connector) {
    return { error: 'not_connected', message: `Connect ${input.provider} first.` };
  }
  if (connector.status !== 'connected') {
    return { error: 'needs_reauth', message: `${input.provider} needs reauth.` };
  }

  const { data: token } = await db
    .from('connector_tokens')
    .select('access_token, refresh_token, expires_at, raw')
    .eq('connector_id', connector.id)
    .maybeSingle();

  if (!token?.access_token) {
    return { error: 'no_token', message: `${input.provider} token missing.` };
  }

  const { data: run } = await db
    .from('connector_runs')
    .insert({
      connector_id: connector.id,
      op_id: input.opId ?? null,
      thread_id: input.threadId ?? null,
      action: actionId,
      request: input.payload,
      output_id: input.outputId ?? null,
        status: 'pending',
    })
    .select()
    .single();

  try {
    let result: Record<string, unknown> = {};

    if (input.provider === 'gmail' && input.action === 'send') {
      /* Refresh the token before sending. */
      const freshToken = await resolveAccessToken(
        db,
        connector.id,
        'gmail',
        token
      );

      const to = String(input.payload.to ?? '').trim();
      const subject = String(input.payload.subject ?? '').trim();
      const body = String(input.payload.body ?? '').trim();
      if (!to || !subject || !body) throw new Error('Missing to/subject/body.');

      const r = await gmailSend({
        accessToken: freshToken,
        from: connector.account_label ?? 'me',
        to,
        subject,
        body,
      });
      result = { messageId: r.messageId };
    } else if (input.provider === 'github' && input.action === 'create-repo') {
      const installationId = (token.raw as any)?.installation_id;
      const accountLogin = (token.raw as any)?.account_login;
      const accountType = (token.raw as any)?.account_type;
      result = await githubCreateRepo({
        accessToken: token.access_token,
        installationId,
        accountLogin,
        accountType,
        params: input.payload as any,
      });
    } else if (input.provider === 'notion' && input.action === 'create-page') {
      result = await notionCreatePage({
        accessToken: token.access_token,
        params: input.payload as any,
      });
    } else if (input.provider === 'slack' && input.action === 'post-message') {
      result = await slackPostMessage({
        accessToken: token.access_token,
        params: input.payload as any,
      });
    } else if (input.provider === 'calendar' && input.action === 'create-event') {
      const freshToken = await resolveAccessToken(
        db,
        connector.id,
        'calendar',
        token
      );
      result = await calendarCreateEvent({
        accessToken: freshToken,
        params: input.payload as any,
      });
    } else if (input.provider === 'vercel' && input.action === 'deploy') {
      result = await vercelDeploy({
        accessToken: token.access_token,
        params: input.payload as any,
      });
    }

    if (run?.id) {
      await db
        .from('connector_runs')
        .update({
          status: 'success',
          response: result,
          external_id:
            (result as any).repoUrl ??
            (result as any).pageUrl ??
            (result as any).eventUrl ??
            (result as any).ts ??
            (result as any).messageId ??
            null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    await db
      .from('connectors')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connector.id);

    return { ok: true, ...result, runId: run?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'action failed';
    if (run?.id) {
      await db
        .from('connector_runs')
        .update({
          status: 'error',
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }
    return { error: 'action_failed', message };
  }
}

// ============================================================
// Debug — tests auth chains
// ============================================================

async function handleDebug(userId: string) {
  const steps: Record<string, unknown> = {};
  try {
    const db = admin();

    /* Gmail check */
    const { data: gConn } = await db
      .from('connectors')
      .select('id, account_label, status')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .is('revoked_at', null)
      .maybeSingle();
    steps.gmailConnected = !!gConn;
    steps.gmailLabel = gConn?.account_label;

    if (gConn) {
      const { data: gTok } = await db
        .from('connector_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('connector_id', gConn.id)
        .maybeSingle();
      steps.gmailHasRefreshToken = !!gTok?.refresh_token;
      steps.gmailExpiresAt = gTok?.expires_at;
      steps.gmailTokenExpired =
        gTok?.expires_at && new Date(gTok.expires_at) < new Date();

      if (gTok?.refresh_token) {
        try {
          const fresh = await refreshGoogleToken(gTok.refresh_token);
          steps.gmailRefreshOk = true;
          steps.gmailFreshTokenLen = fresh.access_token.length;
        } catch (e) {
          steps.gmailRefreshError =
            e instanceof Error ? e.message : String(e);
        }
      }
    }

    /* GitHub check */
    const appId = Deno.env.get('GITHUB_APP_ID');
    const pem = Deno.env.get('GITHUB_PRIVATE_KEY');
    steps.githubAppIdSet = !!appId;
    steps.githubPemSet = !!pem;

    if (appId && pem) {
      try {
        const jwt = await signAppJwt(appId, pem);
        steps.githubJwtLen = jwt.length;
      } catch (e) {
        steps.githubJwtError =
          e instanceof Error ? e.message : String(e);
      }
    }

    const { data: ghConn } = await db
      .from('connectors')
      .select('id, account_label')
      .eq('user_id', userId)
      .eq('provider', 'github')
      .is('revoked_at', null)
      .maybeSingle();
    steps.githubConnected = !!ghConn;

    if (ghConn) {
      const { data: ghTok } = await db
        .from('connector_tokens')
        .select('raw')
        .eq('connector_id', ghConn.id)
        .maybeSingle();
      steps.githubInstallationId = (ghTok?.raw as any)?.installation_id;
      steps.githubAccountType = (ghTok?.raw as any)?.account_type;
    }
  } catch (e) {
    steps.error = e instanceof Error ? e.message : String(e);
  }
  return { debug: steps };
}

// ============================================================
// Server
// ============================================================

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
    if (method === 'debug') {
      const output = await handleDebug(userId);
      return new Response(JSON.stringify({ output }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (method !== 'execute') {
      return new Response(
        JSON.stringify({ error: `unknown method: ${method}` }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const output = await handleExecute(userId, input);
    return new Response(JSON.stringify({ output }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    log('uncaught', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
