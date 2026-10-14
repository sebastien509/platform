import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * useBillingPortal — opens the Stripe Billing Portal so the
 * founder can manage plan, payment method, or cancel.
 */
export function useBillingPortal() {
  return useMutation<{ ok: true }, Error, { workspaceId: string }>({
    mutationFn: async (input) => {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.functions.invoke(
        'stripe-portal',
        {
          body: { input: { workspaceId: input.workspaceId, origin } },
        }
      );
      if (error) throw new Error(error.message);
      const out = data?.output;
      if (out?.error) throw new Error(out.message ?? out.error);
      if (!out?.url) throw new Error('No portal URL returned.');
      window.location.href = out.url;
      return { ok: true };
    },
  });
}
