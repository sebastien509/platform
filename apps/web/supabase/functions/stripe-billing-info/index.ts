// ============================================================
// stripe-billing-info — reads the workspace's current subscription,
// payment method, and invoice history from Stripe.
//
// Returns a single object the /billing page renders.
// Read-only. Never mutates. All writes go through webhook.
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

function tierFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_PRO) return 'pro';
  if (priceId === STRIPE_PRICE_FOUNDER) return 'founder';
  if (priceId === STRIPE_PRICE_TEAM) return 'team';
  return null;
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

  let body: { input?: { workspaceId: string } };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { workspaceId } = body.input ?? {};
  if (!workspaceId) {
    return new Response(
      JSON.stringify({ error: 'workspaceId required' }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  const db = admin();

  /* Verify membership */
  const { data: membership } = await db
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!membership) {
    return new Response(
      JSON.stringify({ error: 'not_a_member' }),
      { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  /* Read the workspace */
  const { data: workspace } = await db
    .from('workspaces')
    .select(
      'id, plan_tier, billing_status, stripe_customer_id, stripe_subscription_id'
    )
    .eq('id', workspaceId)
    .maybeSingle();

  if (!workspace) {
    return new Response(
      JSON.stringify({ error: 'workspace_not_found' }),
      { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  /* No billing on file — return the starter shape */
  if (!STRIPE_SECRET_KEY || !workspace.stripe_customer_id) {
    return new Response(
      JSON.stringify({
        output: {
          plan: workspace.plan_tier ?? 'starter',
          billing_status: workspace.billing_status ?? 'active',
          has_billing: false,
          current_period_end: null,
          cancel_at_period_end: false,
          amount: null,
          interval: null,
          payment_method: null,
          invoices: [],
        },
      }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    /* Subscription details */
    let subscription: Stripe.Subscription | null = null;
    if (workspace.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(
          workspace.stripe_subscription_id,
          { expand: ['default_payment_method'] }
        );
      } catch {
        subscription = null;
      }
    }

    /* Invoices */
    let invoices: Stripe.Invoice[] = [];
    try {
      const list = await stripe.invoices.list({
        customer: workspace.stripe_customer_id,
        limit: 12,
      });
      invoices = list.data;
    } catch {
      invoices = [];
    }

    /* Payment method — from subscription if present, else from customer */
    let paymentMethod: Stripe.PaymentMethod | null = null;
    if (subscription?.default_payment_method) {
      const pm = subscription.default_payment_method;
      paymentMethod = typeof pm === 'string' ? null : pm;
    }

    const priceId = subscription?.items.data[0]?.price?.id;
    const tier =
      tierFromPriceId(priceId) ?? workspace.plan_tier ?? 'starter';

    const result = {
      plan: tier,
      billing_status:
        subscription?.status ?? workspace.billing_status ?? 'active',
      has_billing: true,
      current_period_end: subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
      amount: subscription?.items.data[0]?.price?.unit_amount
        ? subscription.items.data[0].price.unit_amount / 100
        : null,
      interval:
        subscription?.items.data[0]?.price?.recurring?.interval ?? null,
      payment_method: paymentMethod?.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
          }
        : null,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount_paid: inv.amount_paid / 100,
        currency: inv.currency,
        created: new Date(inv.created * 1000).toISOString(),
        status: inv.status,
        hosted_invoice_url: inv.hosted_invoice_url,
        invoice_pdf: inv.invoice_pdf,
      })),
    };

    return new Response(JSON.stringify({ output: result }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    console.error('[stripe-billing-info]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
