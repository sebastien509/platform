// ============================================================
// stripe-portal — returns a Stripe Billing Portal URL so the
// founder can change plan, update payment method, or cancel.
// ============================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
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

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        error: 'not_configured',
        message: 'Stripe is not configured.',
      }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  let body: { input?: { workspaceId: string; origin: string } };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { workspaceId, origin } = body.input ?? {};
  if (!workspaceId || !origin) {
    return new Response(
      JSON.stringify({ error: 'workspaceId and origin required' }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  const db = admin();
  const { data: workspace } = await db
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (!workspace?.stripe_customer_id) {
    return new Response(
      JSON.stringify({
        output: { error: 'no_customer', message: 'No billing on file yet.' },
      }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${origin.replace(/\/$/, '')}/ventures`,
  });

  return new Response(JSON.stringify({ output: { url: session.url } }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
