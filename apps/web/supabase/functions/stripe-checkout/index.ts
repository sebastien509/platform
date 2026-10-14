// ============================================================
// stripe-checkout — creates a Stripe Checkout Session.
//
// POST { workspaceId, tier: 'pro'|'team', origin, returnPath }
//   → returns { url } to redirect the founder to Stripe
//
// Also creates the Stripe customer on first upgrade.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_PRICE_PRO = Deno.env.get('STRIPE_PRICE_PRO');
const STRIPE_PRICE_FOUNDER = Deno.env.get('STRIPE_PRICE_FOUNDER');
const STRIPE_PRICE_TEAM = Deno.env.get('STRIPE_PRICE_TEAM');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

async function handleCheckout(
  userId: string,
  input: {
    workspaceId: string;
    tier: 'pro' | 'founder' | 'team';
    origin: string;
    returnPath?: string;
  }
) {
  if (!STRIPE_SECRET_KEY) {
    return { error: 'not_configured', message: 'STRIPE_SECRET_KEY missing.' };
  }
  if (!input.workspaceId) {
    return { error: 'missing_workspace', message: 'workspaceId required.' };
  }

  const priceId =
    input.tier === 'team'
      ? STRIPE_PRICE_TEAM
      : input.tier === 'founder'
      ? STRIPE_PRICE_FOUNDER
      : STRIPE_PRICE_PRO;
  if (!priceId) {
    return {
      error: 'not_configured',
      message: `Price ID for tier ${input.tier} not set (STRIPE_PRICE_${input.tier.toUpperCase()}).`,
    };
  }

  const db = admin();

  /* Verify the user is a member of the workspace. */
  const { data: membership } = await db
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle();

  if (!membership) {
    return { error: 'not_a_member', message: 'Not a member of this workspace.' };
  }

  /* Read the workspace + the user's email. */
  const { data: workspace } = await db
    .from('workspaces')
    .select('id, name, stripe_customer_id')
    .eq('id', input.workspaceId)
    .maybeSingle();

  if (!workspace) {
    return { error: 'workspace_not_found' };
  }

  const { data: user } = await db
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .maybeSingle();

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  /* Get or create the Stripe customer. */
  let customerId = workspace.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { workspace_id: workspace.id },
    });
    customerId = customer.id;
    await db
      .from('workspaces')
      .update({ stripe_customer_id: customerId })
      .eq('id', workspace.id);
  }

  const base = input.origin.replace(/\/$/, '');
  const returnPath = input.returnPath ?? '/ventures';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: workspace.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}${returnPath}?upgraded=1`,
    cancel_url: `${base}${returnPath}?upgraded=0`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { workspace_id: workspace.id },
    },
  });

  return { url: session.url, sessionId: session.id };
}

async function handleDebug() {
  const keyPrefix = (STRIPE_SECRET_KEY ?? '').slice(0, 8);
  const mode = keyPrefix.startsWith('sk_test_')
    ? 'test'
    : keyPrefix.startsWith('sk_live_')
    ? 'live'
    : 'unknown';

  const results: Record<string, unknown> = {
    mode,
    keyPrefix,
    pro: { env: !!STRIPE_PRICE_PRO, lookup: null },
    founder: { env: !!STRIPE_PRICE_FOUNDER, lookup: null },
    team: { env: !!STRIPE_PRICE_TEAM, lookup: null },
  };

  if (!STRIPE_SECRET_KEY) return { error: 'no_secret_key', ...results };

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  for (const [tier, priceId] of [
    ['pro', STRIPE_PRICE_PRO],
    ['founder', STRIPE_PRICE_FOUNDER],
    ['team', STRIPE_PRICE_TEAM],
  ] as const) {
    if (!priceId) {
      (results[tier] as any).lookup = 'env_missing';
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId);
      (results[tier] as any).lookup = {
        ok: true,
        livemode: price.livemode,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        priceId,
      };
    } catch (e) {
      (results[tier] as any).lookup = {
        ok: false,
        error: e instanceof Error ? e.message : 'lookup failed',
        priceId,
      };
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: CORS });
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

  try {
    if (body.method === 'debug') {
      const output = await handleDebug();
      return new Response(JSON.stringify({ output }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const output = await handleCheckout(userId, body.input ?? {});
    return new Response(JSON.stringify({ output }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    console.error('[stripe-checkout]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
