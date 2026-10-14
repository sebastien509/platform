import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * useUpgrade — kicks off Stripe Checkout for the workspace.
 * On success the browser is redirected to Stripe.
 * On failure the mutation returns an error string the caller
 * can render.
 */
export function useUpgrade() {
  return useMutation<
    { ok: true },
    Error,
    { workspaceId: string; tier: 'pro' | 'founder' | 'team'; returnPath?: string }
  >({
    mutationFn: async (input) => {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.functions.invoke(
        'stripe-checkout',
        {
          body: {
            input: {
              workspaceId: input.workspaceId,
              tier: input.tier,
              origin,
              returnPath: input.returnPath,
            },
          },
        }
      );
      if (error) throw new Error(error.message);
      const out = data?.output;
      if (out?.error) throw new Error(out.message ?? out.error);
      if (!out?.url) throw new Error('No checkout URL returned.');

      /* Redirect — the caller doesn't need to handle the result. */
      window.location.href = out.url;
      return { ok: true };
    },
  });
}
