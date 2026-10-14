import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BillingInvoice {
  id: string;
  number: string | null;
  amount_paid: number;
  currency: string;
  created: string;
  status: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export interface BillingPaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface BillingInfo {
  plan: string;
  billing_status: string;
  has_billing: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount: number | null;
  interval: string | null;
  payment_method: BillingPaymentMethod | null;
  invoices: BillingInvoice[];
}

export function useBillingInfo(workspaceId: string | null | undefined) {
  return useQuery<BillingInfo>({
    queryKey: ['billing-info', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await supabase.functions.invoke(
        'stripe-billing-info',
        { body: { input: { workspaceId } } }
      );
      if (error) throw new Error(error.message);
      const out = data?.output;
      if (!out || out.error) {
        throw new Error(out?.message ?? out?.error ?? 'Failed to load billing');
      }
      return out as BillingInfo;
    },
    staleTime: 30_000,
  });
}
