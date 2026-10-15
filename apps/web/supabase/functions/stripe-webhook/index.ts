// ============================================================
// stripe-webhook — the sync point for billing state.
//
// Every event is logged to stripe_webhook_events so we can
// debug failures even after the edge function logs roll off.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const STRIPE_PRICE_PRO = Deno.env.get('STRIPE_PRICE_PRO');
const STRIPE_PRICE_FOUNDER = Deno.env.get('STRIPE_PRICE_FOUNDER');
const STRIPE_PRICE_TEAM = Deno.env.get('STRIPE_PRICE_TEAM');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('[stripe-webhook] boot', {
  hasSecret: Boolean(STRIPE_SECRET_KEY),
  hasWebhookSecret: Boolean(STRIPE_WEBHOOK_SECRET),
  hasPricePro: Boolean(STRIPE_PRICE_PRO),
  hasPriceFounder: Boolean(STRIPE_PRICE_FOUNDER),
  hasPriceTeam: Boolean(STRIPE_PRICE_TEAM),
  hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
});

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function tierFromPriceId(
  priceId: string | undefined
): 'pro' | 'founder' | 'team' | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_PRO) return 'pro';
  if (priceId === STRIPE_PRICE_FOUNDER) return 'founder';
  if (priceId === STRIPE_PRICE_TEAM) return 'team';
  console.warn('[stripe-webhook] unknown price', priceId);
  return null;
}

const TIER_TO_VENTURE_LIMIT: Record<string, number> = {
  starter: 0,
  pro: 1,
  founder: 999,
  team: 999,
};

function workspaceSync(
  tier: string,
  subscriptionId: string | null,
  status: string,
): Record<string, unknown> {
  return {
    plan_tier: tier,
    venture_limit: TIER_TO_VENTURE_LIMIT[tier] ?? 0,
    stripe_subscription_id: subscriptionId,
    billing_status: status,
  };
}

async function logEvent(
  eventId: string,
  eventType: string,
  workspaceId: string | null,
  payload: unknown,
  status: string,
  errorMessage?: string,
) {
  try {
    const db = admin();
    const { error } = await db.from('stripe_webhook_events').upsert(
      {
        event_id: eventId,
        event_type: eventType,
        workspace_id: workspaceId,
        payload: payload as any,
        status,
        error_message: errorMessage ?? null,
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'event_id' },
    );
    if (error) {
      console.error('[stripe-webhook] logEvent failed', error.message);
    }
  } catch (e) {
    console.error('[stripe-webhook] logEvent threw', e);
  }
}

async function updateWorkspace(
  workspaceId: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  console.log('[stripe-webhook] updateWorkspace', workspaceId, patch);
  const db = admin();

  const { data, error } = await db
    .from('workspaces')
    .update(patch)
    .eq('id', workspaceId)
    .select('id, plan_tier, venture_limit, billing_status, stripe_subscription_id');

  if (error) {
    console.error('[stripe-webhook] update FAILED', error);
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    console.error('[stripe-webhook] update affected ZERO rows', workspaceId);
    return { ok: false, error: 'workspace_not_found_or_rls_blocked' };
  }
  console.log('[stripe-webhook] update OK', data[0]);
  return { ok: true };
}

async function handleEvent(event: Stripe.Event) {
  console.log('[stripe-webhook] handleEvent', event.id, event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.client_reference_id;

      console.log('[stripe-webhook] checkout.session.completed', {
        sessionId: session.id,
        clientReferenceId: workspaceId,
        subscriptionId: session.subscription,
      });

      if (!workspaceId) {
        await logEvent(event.id, event.type, null, session, 'skipped', 'no_client_reference_id');
        return;
      }

      let tier: 'pro' | 'founder' | 'team' | null = null;
      let subscriptionId: string | null = null;
      if (session.subscription) {
        subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
        if (stripe && subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            tier = tierFromPriceId(sub.items.data[0]?.price?.id);
          } catch (e) {
            console.warn('[stripe-webhook] sub retrieve failed', e);
          }
        }
      }

      const result = await updateWorkspace(
        workspaceId,
        workspaceSync(tier ?? 'pro', subscriptionId, 'active'),
      );
      await logEvent(
        event.id,
        event.type,
        workspaceId,
        session,
        result.ok ? 'processed' : 'failed',
        result.error,
      );
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = (sub.metadata?.workspace_id as string) ?? null;

      console.log('[stripe-webhook]', event.type, {
        subId: sub.id,
        workspaceId,
        status: sub.status,
      });

      if (!workspaceId) {
        await logEvent(event.id, event.type, null, sub, 'skipped', 'no_workspace_id_in_metadata');
        return;
      }

      const tier = tierFromPriceId(sub.items.data[0]?.price?.id);
      const status =
        sub.status === 'active' || sub.status === 'trialing'
          ? 'active'
          : sub.status === 'past_due'
          ? 'past_due'
          : sub.status === 'canceled'
          ? 'canceled'
          : 'active';

      const tierKey = tier ?? 'pro';
      const result = await updateWorkspace(
        workspaceId,
        workspaceSync(tierKey, sub.id, status),
      );
      await logEvent(
        event.id,
        event.type,
        workspaceId,
        sub,
        result.ok ? 'processed' : 'failed',
        result.error,
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = (sub.metadata?.workspace_id as string) ?? null;
      if (!workspaceId) {
        await logEvent(event.id, event.type, null, sub, 'skipped', 'no_workspace_id_in_metadata');
        return;
      }
      const result = await updateWorkspace(
        workspaceId,
        workspaceSync('starter', null, 'canceled'),
      );
      await logEvent(
        event.id,
        event.type,
        workspaceId,
        sub,
        result.ok ? 'processed' : 'failed',
        result.error,
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) {
        await logEvent(event.id, event.type, null, invoice, 'skipped', 'no_customer');
        return;
      }
      const db = admin();
      const { data: ws } = await db
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (ws) {
        const result = await updateWorkspace(ws.id, { billing_status: 'past_due' });
        await logEvent(event.id, event.type, ws.id, invoice, result.ok ? 'processed' : 'failed', result.error);
      } else {
        await logEvent(event.id, event.type, null, invoice, 'skipped', 'no_workspace_for_customer');
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) {
        await logEvent(event.id, event.type, null, invoice, 'skipped', 'no_customer');
        return;
      }
      const db = admin();
      const { data: ws } = await db
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (ws) {
        const result = await updateWorkspace(ws.id, { billing_status: 'active' });
        await logEvent(event.id, event.type, ws.id, invoice, result.ok ? 'processed' : 'failed', result.error);
      } else {
        await logEvent(event.id, event.type, null, invoice, 'skipped', 'no_workspace_for_customer');
      }
      break;
    }

    default:
      await logEvent(event.id, event.type, null, {}, 'ignored');
      break;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] not configured');
    return new Response('Not configured', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'invalid signature';
    console.error('[stripe-webhook] signature verification failed', message);
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'handler error';
    console.error('[stripe-webhook] HANDLER THREW', e);
    await logEvent(event.id, event.type, null, event, 'threw', message);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
