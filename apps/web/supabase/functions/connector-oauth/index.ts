// ============================================================
// connector-oauth — the OAuth spine for every provider.
//
// Three methods:
//   · start      — mints a state token, returns the consent URL
//   · callback   — validates state, exchanges code for token,
//                  writes connectors + connector_tokens rows
//   · disconnect — revokes the token, marks the connector revoked
//
// The redirect URI points at the SPA (`/connectors/callback`),
// not at this function. Supabase Edge Functions don't route by
// path, so the browser lands on the SPA, which reads code+state
// and POSTs back here. The redirect URI is stored with the state
// so the token exchange uses the exact same value.
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

type ProviderFlow = 'oauth' | 'install';

interface OAuthAdapter {
  name: string;
  flow: 'oauth';
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  consentUrl: (input: {
    clientId: string;
    redirectUri: string;
    state: string;
    scopes: string[];
  }) => string;
  exchangeCode: (input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) => Promise<{
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    raw: unknown;
    accountLabel?: string;
  }>;
  revokeToken?: (token: string) => Promise<void>;
}

interface InstallAdapter {
  name: string;
  flow: 'install';
  appIdEnv: string;
  appSlugEnv: string;
  privateKeyEnv: string;
  /** Public URL to install the GitHub App on an account / org. */
  installUrl: (input: { slug: string; state: string }) => string;
  /** Exchange the installation_id for a scoped access token. */
  exchangeInstall: (input: {
    installationId: string;
    appId: string;
    privateKey: string;
  }) => Promise<{
    access_token: string;
    expires_at: string;   // ISO
    accountLogin: string;
    accountType: string;
    scopes: string[];
    raw: unknown;
  }>;
}

type ProviderAdapter = OAuthAdapter | InstallAdapter;

/* Normalise PEM newlines — Supabase secrets often store literal \n */
function normalisePem(pem: string): string {
  return pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
}

/* Decode a base64 string into a Uint8Array without stack overflow
   for long inputs (spread operator fails on ~100kB). */
function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/* Wrap a PKCS1 RSA private key in a PKCS8 container. GitHub
   gives us PKCS1 by default; Web Crypto + jose only accept
   PKCS8. The wrapper is a fixed ASN.1 prefix. */
function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const pkcs1Len = pkcs1.length;
  /* Content = version(3) + algo(15) + octetHeader(4) + pkcs1 */
  const contentLen = pkcs1Len + 22;
  const totalLen = contentLen + 4;
  const out = new Uint8Array(totalLen);
  let i = 0;
  out[i++] = 0x30;
  out[i++] = 0x82;
  out[i++] = (contentLen >> 8) & 0xff;
  out[i++] = contentLen & 0xff;
  out[i++] = 0x02; out[i++] = 0x01; out[i++] = 0x00;
  /* AlgorithmIdentifier: rsaEncryption */
  const algo = [
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7,
    0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ];
  for (const b of algo) out[i++] = b;
  /* OCTET STRING header */
  out[i++] = 0x04;
  out[i++] = 0x82;
  out[i++] = (pkcs1Len >> 8) & 0xff;
  out[i++] = pkcs1Len & 0xff;
  out.set(pkcs1, i);
  return out;
}

/* Parse a PEM into a PKCS8 Uint8Array — handles both PKCS8 and
   PKCS1. Uses Web Crypto for the actual JWT signature so we
   don't depend on any external library. */
function pemToPkcs8(pem: string): Uint8Array {
  const clean = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const bytes = b64ToBytes(clean);
  if (pem.includes('BEGIN RSA PRIVATE KEY')) {
    return pkcs1ToPkcs8(bytes);
  }
  return bytes;
}

function b64url(input: Uint8Array | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/* Sign a JWT (RS256) as the GitHub App — used to exchange an
   installation id for a scoped installation token. */
async function signGithubAppJwt(
  appId: string,
  privateKeyPem: string
): Promise<string> {
  log('jwt: start', { appId, pemLen: privateKeyPem.length });

  try {
    const pem = normalisePem(privateKeyPem);
    log('jwt: pem normalised', { hasNewlines: pem.includes('\n') });

    const pkcs8 = pemToPkcs8(pem);
    log('jwt: pkcs8 built', { len: pkcs8.length });

    const key = await crypto.subtle.importKey(
      'pkcs8',
      pkcs8,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    log('jwt: key imported');

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = { iat: now - 60, exp: now + 540, iss: appId };

    const h = b64url(JSON.stringify(header));
    const p = b64url(JSON.stringify(payload));
    const data = new TextEncoder().encode(`${h}.${p}`);

    const sigBytes = new Uint8Array(
      await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
    );
    const sig = b64url(sigBytes);

    log('jwt: signed', { sigLen: sig.length });
    return `${h}.${p}.${sig}`;
  } catch (e) {
    log('jwt: FAILED', {
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

const ADAPTERS: Record<string, ProviderAdapter | null> = {
  gmail: {
    name: 'Gmail',
    clientIdEnv: 'GMAIL_CLIENT_ID',
    clientSecretEnv: 'GMAIL_CLIENT_SECRET',
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    consentUrl: ({ clientId, redirectUri, state, scopes }) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google token exchange failed: ${text.slice(0, 300)}`);
      }
      const json = await res.json();

      let accountLabel: string | undefined;
      try {
        const meRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${json.access_token}` } }
        );
        if (meRes.ok) {
          const me = await meRes.json();
          accountLabel = me.email;
        }
      } catch {
        /* Non-fatal */
      }

      return {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        token_type: json.token_type,
        expires_in: json.expires_in,
        scope: json.scope,
        raw: json,
        accountLabel,
      };
    },
    revokeToken: async (token) => {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });
    },
  },
  github: {
    name: 'GitHub',
    flow: 'install',
    appIdEnv: 'GITHUB_APP_ID',
    appSlugEnv: 'GITHUB_APP_SLUG',
    privateKeyEnv: 'GITHUB_PRIVATE_KEY',
    installUrl: ({ slug, state }) =>
      `https://github.com/apps/${slug}/installations/new?state=${state}`,
    exchangeInstall: async ({ installationId, appId, privateKey }) => {
      const jwt = await signGithubAppJwt(appId, privateKey);

      /* Get the installation token */
      log('github: exchange token start', { installationId });
      const tokenRes = await fetchT(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        throw new Error(
          `GitHub installation token failed (${tokenRes.status}): ${text.slice(0, 300)}`
        );
      }
      const tokenJson = await tokenRes.json();

      /* Fetch the installation to get the account login */
      const infoRes = await fetchT(
        `https://api.github.com/app/installations/${installationId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      let accountLogin = 'unknown';
      let accountType = 'User';
      if (infoRes.ok) {
        const info = await infoRes.json();
        accountLogin = info.account?.login ?? 'unknown';
        accountType = info.account?.type ?? 'User';
      }

      return {
        access_token: tokenJson.token,
        expires_at: tokenJson.expires_at,
        accountLogin,
        accountType,
        scopes: [], // installation tokens inherit app permissions
        raw: {
          installation_id: installationId,
          account_login: accountLogin,
          account_type: accountType,
        },
      };
    },
  },
  /* ────────────────────────────────────────────────────────
     VERCEL — OAuth via Integrations
     Setup: vercel.com/account/integrations/console → Create
     ──────────────────────────────────────────────────────── */
  vercel: {
    name: 'Vercel',
    flow: 'install',              /* Integration OAuth — uses the install-flow slug pattern */
    appIdEnv: 'VERCEL_CLIENT_ID', /* not used, but required by the interface */
    appSlugEnv: 'VERCEL_INTEGRATION_SLUG',
    privateKeyEnv: 'VERCEL_CLIENT_SECRET', /* not used, but required */
    installUrl: ({ slug, state }) =>
      `https://vercel.com/integrations/${slug}/new?state=${state}`,
    exchangeInstall: async ({
      installationId,
      appId,
      privateKey,
      redirectUri,
    }) => {
      /* installationId === the OAuth `code` Vercel sends back. */
      log('vercel exchange diag', {
        code_len: installationId.length,
        code_first20: installationId.slice(0, 20),
        code_last10: installationId.slice(-10),
        code_has_plus: installationId.includes('+'),
        code_has_percent: installationId.includes('%'),
        code_has_space: /\s/.test(installationId),
        redirect_uri: redirectUri ?? '(none)',
        client_id_prefix: appId.slice(0, 12),
        client_id_len: appId.length,
        client_secret_len: privateKey.length,
        client_secret_has_ws: /\s/.test(privateKey),
      });
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: privateKey,
        code: installationId,
      });
      /* Vercel requires redirect_uri on the token exchange and it
         must exactly match what's registered on the integration. */
      if (redirectUri) params.set('redirect_uri', redirectUri);
      const res = await fetchT(
        'https://api.vercel.com/v2/oauth/access_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Vercel token exchange failed (${res.status}): ${text.slice(0, 300)}`
        );
      }
      const json = await res.json();

      let accountLogin = 'unknown';
      let accountType = 'User';
      try {
        const meRes = await fetchT('https://api.vercel.com/v2/user', {
          headers: { Authorization: `Bearer ${json.access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          accountLogin = me.user?.username ?? me.user?.email ?? 'unknown';
          accountType = me.user?.username ? 'User' : 'Team';
        }
      } catch { /* non-fatal */ }

      return {
        access_token: json.access_token,
        expires_at: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        accountLogin,
        accountType,
        scopes: [],
        raw: json,
      };
    },
  },

  /* ────────────────────────────────────────────────────────
     STRIPE CONNECT — OAuth
     Setup: dashboard.stripe.com/settings/connect
     ──────────────────────────────────────────────────────── */
  stripe: {
    name: 'Stripe',
    flow: 'oauth',
    clientIdEnv: 'STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_SECRET_KEY',
    scopes: ['read_only'],
    consentUrl: ({ clientId, redirectUri, state, scopes }) => {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes[0] ?? 'read_only',
        redirect_uri: redirectUri,
        state,
      });
      return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_secret: clientSecret,
        client_id: clientId,
        redirect_uri: redirectUri,
      });
      const res = await fetchT('https://connect.stripe.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Stripe token exchange failed: ${text.slice(0, 300)}`);
      }
      const json = await res.json();
      return {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        token_type: json.token_type,
        scope: json.scope,
        raw: json,
        accountLabel: json.stripe_user_id,
      };
    },
  },

  /* ────────────────────────────────────────────────────────
     GOOGLE CALENDAR — reuses Gmail's Google OAuth client.
     No new setup — same GOOGLE_CLIENT_ID/SECRET.
     ──────────────────────────────────────────────────────── */
  calendar: {
    name: 'Google Calendar',
    flow: 'oauth',
    clientIdEnv: 'GMAIL_CLIENT_ID',
    clientSecretEnv: 'GMAIL_CLIENT_SECRET',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    consentUrl: ({ clientId, redirectUri, state, scopes }) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      const res = await fetchT('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google token exchange failed: ${text.slice(0, 300)}`);
      }
      const json = await res.json();

      let accountLabel: string | undefined;
      try {
        const meRes = await fetchT(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${json.access_token}` } }
        );
        if (meRes.ok) {
          const me = await meRes.json();
          accountLabel = me.email;
        }
      } catch { /* non-fatal */ }

      return {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        token_type: json.token_type,
        expires_in: json.expires_in,
        scope: json.scope,
        raw: json,
        accountLabel,
      };
    },
    revokeToken: async (token) => {
      await fetchT(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });
    },
  },

  /* ────────────────────────────────────────────────────────
     NOTION — OAuth 2.0 (public integration)
     Setup: notion.so/my-integrations → New integration
     Notion requires Basic auth for token exchange.
     ──────────────────────────────────────────────────────── */
  notion: {
    name: 'Notion',
    flow: 'oauth',
    clientIdEnv: 'NOTION_CLIENT_ID',
    clientSecretEnv: 'NOTION_CLIENT_SECRET',
    scopes: [],
    consentUrl: ({ clientId, redirectUri, state }) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        owner: 'user',
        state,
      });
      return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const basic = btoa(`${clientId}:${clientSecret}`);
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });
      const res = await fetchT('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion token exchange failed: ${text.slice(0, 300)}`);
      }
      const json = await res.json();
      const label =
        json.owner?.user?.person?.email ??
        json.owner?.user?.name ??
        json.workspace_name ??
        json.bot_id;
      return {
        access_token: json.access_token,
        token_type: 'Bearer',
        raw: json,
        accountLabel: label,
      };
    },
  },

  /* ────────────────────────────────────────────────────────
     SLACK — OAuth 2.0
     Setup: api.slack.com/apps → Create New App → From scratch
     ──────────────────────────────────────────────────────── */
  slack: {
    name: 'Slack',
    flow: 'oauth',
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    consentUrl: ({ clientId, redirectUri, state, scopes }) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(','),
        state,
      });
      return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    },
    exchangeCode: async ({ code, clientId, clientSecret, redirectUri }) => {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });
      const res = await fetchT('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Slack token exchange failed: ${text.slice(0, 300)}`);
      }
      const json = await res.json();
      if (!json.ok) {
        throw new Error(`Slack error: ${json.error ?? 'unknown'}`);
      }
      return {
        access_token: json.access_token,
        token_type: 'Bearer',
        scope: json.scope,
        raw: json,
        accountLabel: json.team?.name ?? json.authed_user?.id,
      };
    },
  },

  /* Stubs — no OAuth yet. */
  supabase: null,
  linear: null,
  hubspot: null,
  posthog: null,
};

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

/* Wrap every external fetch in a timeout so the edge function
   never hangs indefinitely. */
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
    console.log(`[connector-oauth] ${step}`, extra ? JSON.stringify(extra) : '');
  } catch {
    console.log(`[connector-oauth] ${step}`);
  }
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

/* State is '{provider}_{20-char-random}'. The provider prefix is
   what lets the SPA tell us which adapter to use on callback —
   Google doesn't forward extra query params. */
function generateState(provider: string): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = provider + '_';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

function providerFromState(state: string): string | null {
  const idx = state.indexOf('_');
  if (idx <= 0) return null;
  return state.slice(0, idx);
}

async function handleStart(
  userId: string,
  input: { provider: string; redirectUri: string; returnTo?: string }
) {
  const adapter = ADAPTERS[input.provider];
  log('start', { provider: input.provider, userId });
  if (!adapter) {
    log('start: no adapter');
    return {
      error: 'not_available',
      message: `Provider ${input.provider} is not yet available.`,
    };
  }

  const state = generateState(input.provider);
  const db = admin();

  /* Persist the state, regardless of flow. */
  const { error: stateErr } = await db
    .from('connector_oauth_state')
    .insert({
      state,
      user_id: userId,
      provider: input.provider,
      return_to: input.returnTo ?? null,
      redirect_uri: input.redirectUri,
    });
  if (stateErr) {
    return { error: 'state_insert_failed', message: stateErr.message };
  }

  /* ── OAuth flow ── */
  if (adapter.flow === 'oauth') {
    const clientId = Deno.env.get(adapter.clientIdEnv);
    const clientSecret = Deno.env.get(adapter.clientSecretEnv);
    if (!clientId || !clientSecret) {
      return {
        error: 'not_configured',
        message: `Add ${adapter.clientIdEnv} and ${adapter.clientSecretEnv} to Supabase secrets.`,
      };
    }

    const consentUrl = adapter.consentUrl({
      clientId,
      redirectUri: input.redirectUri,
      state,
      scopes: adapter.scopes,
    });
    return { consentUrl, state };
  }

  /* ── Install flow (GitHub App) ── */
  const slug = Deno.env.get(adapter.appSlugEnv);
  const appId = Deno.env.get(adapter.appIdEnv);
  const privateKey = Deno.env.get(adapter.privateKeyEnv);
  if (!slug || !appId || !privateKey) {
    return {
      error: 'not_configured',
      message: `Add ${adapter.appIdEnv}, ${adapter.appSlugEnv} and ${adapter.privateKeyEnv} to Supabase secrets.`,
    };
  }

  const consentUrl = adapter.installUrl({ slug, state });
  return { consentUrl, state };
}

async function handleCallback(
  userId: string,
  input: { state: string; code?: string; installationId?: string }
) {
  const provider = providerFromState(input.state);
  if (!provider) return { error: 'invalid_state' };

  const adapter = ADAPTERS[provider];
  if (!adapter) return { error: 'not_available' };

  const db = admin();

  const { data: stateRow } = await db
    .from('connector_oauth_state')
    .select('*')
    .eq('state', input.state)
    .eq('user_id', userId)
    .maybeSingle();

  if (!stateRow) return { error: 'invalid_state' };

  /* If the state was already consumed, this is a retry (StrictMode
     double-fire, back-button, page refresh). If we already have a
     live connection for this user + provider that landed within
     the last 5 minutes, treat it as success. Otherwise it's a
     genuine reuse — reject. */
  if (stateRow.used_at) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existing } = await db
      .from('connectors')
      .select('id, connected_at')
      .eq('user_id', userId)
      .eq('provider', provider)
      .is('revoked_at', null)
      .gt('connected_at', fiveMinAgo)
      .maybeSingle();

    if (existing) {
      return { ok: true, provider, returnTo: stateRow.return_to };
    }
    return { error: 'state_reused' };
  }

  const age = Date.now() - new Date(stateRow.created_at).getTime();
  if (age > 10 * 60 * 1000) return { error: 'state_expired' };
  if (stateRow.provider !== provider) return { error: 'provider_mismatch' };

  await db
    .from('connector_oauth_state')
    .update({ used_at: new Date().toISOString() })
    .eq('state', input.state);

  /* ── Common write path ── */
  let connectorRow: any;
  let tokenRow: any;
  let accountLabel: string | undefined;

  if (adapter.flow === 'oauth') {
    const clientId = Deno.env.get(adapter.clientIdEnv);
    const clientSecret = Deno.env.get(adapter.clientSecretEnv);
    if (!clientId || !clientSecret) return { error: 'not_configured' };
    if (!input.code) return { error: 'missing_code' };

    let token;
    try {
      token = await adapter.exchangeCode({
        code: input.code,
        clientId,
        clientSecret,
        redirectUri: stateRow.redirect_uri ?? '',
      });
    } catch (e) {
      return {
        error: 'exchange_failed',
        message: e instanceof Error ? e.message : 'unknown',
      };
    }

    accountLabel = token.accountLabel;
    tokenRow = {
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      token_type: token.token_type ?? null,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      scopes: token.scope ? token.scope.split(' ') : adapter.scopes,
      raw: token.raw,
    };
  } else {
    /* Install flow — GitHub App sends `installation_id`,
       Vercel Integration OAuth sends `code`. Both flow through
       here; the adapter treats the value as its exchange input. */
    const appId = Deno.env.get(adapter.appIdEnv);
    const privateKey = Deno.env.get(adapter.privateKeyEnv);
    if (!appId || !privateKey) return { error: 'not_configured' };

    const installHandle = input.installationId ?? input.code;
    if (!installHandle) return { error: 'missing_installation_id' };

    let installed;
    try {
      installed = await adapter.exchangeInstall({
        installationId: installHandle,
        appId,
        privateKey,
        redirectUri: stateRow.redirect_uri ?? undefined,
      });
    } catch (e) {
      return {
        error: 'install_failed',
        message: e instanceof Error ? e.message : 'unknown',
      };
    }

    accountLabel = installed.accountLogin;
    tokenRow = {
      access_token: installed.access_token,
      refresh_token: null,
      token_type: 'Bearer',
      expires_at: installed.expires_at,
      scopes: installed.scopes,
      raw: installed.raw,
    };
  }

  /* Revoke prior active row for this provider. */
  await db
    .from('connectors')
    .update({ revoked_at: new Date().toISOString(), status: 'revoked' })
    .eq('user_id', userId)
    .eq('provider', provider)
    .is('revoked_at', null);

  const { data: connector, error: connErr } = await db
    .from('connectors')
    .insert({
      user_id: userId,
      provider,
      status: 'connected',
      account_label: accountLabel ?? null,
      scopes: tokenRow.scopes,
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (connErr || !connector) {
    return { error: 'connector_insert_failed', message: connErr?.message };
  }

  const { error: tokErr } = await db
    .from('connector_tokens')
    .insert({ connector_id: connector.id, ...tokenRow });

  if (tokErr) {
    await db.from('connectors').delete().eq('id', connector.id);
    return { error: 'token_insert_failed', message: tokErr.message };
  }

  return { ok: true, provider, returnTo: stateRow.return_to };
}

async function handleDisconnect(
  userId: string,
  input: { provider: string }
) {
  const adapter = ADAPTERS[input.provider];
  const db = admin();

  const { data: row } = await db
    .from('connectors')
    .select('id, account_label')
    .eq('user_id', userId)
    .eq('provider', input.provider)
    .is('revoked_at', null)
    .maybeSingle();

  if (!row) return { ok: true };

  if (adapter?.revokeToken) {
    const { data: tok } = await db
      .from('connector_tokens')
      .select('access_token')
      .eq('connector_id', row.id)
      .maybeSingle();
    if (tok?.access_token) {
      try {
        await adapter.revokeToken(tok.access_token);
      } catch {
        /* Non-fatal */
      }
    }
  }

  await db.from('connector_tokens').delete().eq('connector_id', row.id);
  await db
    .from('connectors')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', row.id);

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
    return new Response(
      JSON.stringify({ error: 'not authenticated' }),
      { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
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
    let output;
    switch (method) {
      case 'start':
        output = await handleStart(userId, input);
        break;
      case 'callback':
        output = await handleCallback(userId, input);
        break;
      case 'disconnect':
        output = await handleDisconnect(userId, input);
        break;
      case 'debug':
        /* Sign a JWT and return metadata — verifies the private
           key works without touching GitHub. */
        {
          const adapter = ADAPTERS['github'];
          if (!adapter || adapter.flow !== 'install') {
            output = { error: 'github_not_install_flow' };
          } else {
            const appId = Deno.env.get(adapter.appIdEnv);
            const privateKey = Deno.env.get(adapter.privateKeyEnv);
            if (!appId || !privateKey) {
              output = {
                error: 'missing_secrets',
                appIdSet: !!appId,
                keySet: !!privateKey,
              };
            } else {
              try {
                const jwt = await signGithubAppJwt(appId, privateKey);
                output = {
                  ok: true,
                  appId,
                  keyLen: privateKey.length,
                  keyFirstLine: privateKey.split('\n')[0],
                  jwtLen: jwt.length,
                  jwtPrefix: jwt.slice(0, 30),
                };
              } catch (e) {
                output = {
                  ok: false,
                  error: e instanceof Error ? e.message : String(e),
                  appId,
                  keyLen: privateKey.length,
                  keyFirstLine: privateKey.split('\n')[0],
                };
              }
            }
          }
        }
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
    console.error('[connector-oauth]', method, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
