import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useCurrentWorkspace } from '@/lib/hooks/useWorkspace';
import { useBillingInfo } from '@/lib/hooks/useBillingInfo';
import { useBillingPortal } from '@/lib/hooks/useBillingPortal';
import { useWorkspacePlan } from '@/lib/hooks/useWorkspacePlan';
import { cn } from '@/lib/utils/cn';
import {
  CreditCard,
  FileText,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  founder: 'Founder Premium',
  team: 'Team',
};

const STATUS_TONE: Record<string, string> = {
  active: 'is-ok',
  trialing: 'is-ok',
  past_due: 'is-warn',
  canceled: 'is-muted',
  incomplete: 'is-warn',
  incomplete_expired: 'is-muted',
  unpaid: 'is-error',
};

export default function BillingPage() {
  const navigate = useNavigate();
  const workspace = useCurrentWorkspace();
  const billing = useBillingInfo(workspace.data?.id);
  const portal = useBillingPortal();
  const { plan } = useWorkspacePlan();
  const [error, setError] = useState<string | null>(null);

  if (workspace.isLoading || billing.isLoading) {
    return (
      <PageContainer>
        <header className="marketplace-hero">
          <h1 className="marketplace-hero__title">Billing</h1>
        </header>
        <LoadingSkeleton count={3} className="h-32" />
      </PageContainer>
    );
  }

  const info = billing.data;
  const tier = info?.plan ?? plan.tier;
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const status = info?.billing_status ?? 'active';
  const statusTone = STATUS_TONE[status] ?? 'is-muted';

  async function handleManage() {
    if (!workspace.data?.id) return;
    setError(null);
    try {
      await portal.mutateAsync({ workspaceId: workspace.data.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open portal.');
    }
  }

  const periodEnd = info?.current_period_end
    ? new Date(info.current_period_end)
    : null;
  const cancelScheduled = info?.cancel_at_period_end;

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Billing</h1>
        <p className="marketplace-hero__lede">
          Your plan, payment method, and invoice history.
        </p>
      </header>

      {error && (
        <div className="billing-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Plan card */}
      <section className="billing-card">
        <header className="billing-card__head">
          <span className="billing-card__label">Current plan</span>
          <span className={cn('billing-status-pill', statusTone)}>
            {statusLabel(status)}
          </span>
        </header>

        <div className="billing-plan">
          <div className="billing-plan__main">
            <h2 className="billing-plan__name">{tierLabel}</h2>
            {info?.amount != null ? (
              <p className="billing-plan__price">
                ${info.amount}
                <span className="billing-plan__cadence">
                  /{info.interval ?? 'mo'}
                </span>
              </p>
            ) : (
              <p className="billing-plan__price">Free</p>
            )}
          </div>

          <div className="billing-plan__meta">
            {periodEnd && !cancelScheduled && (
              <span>
                Renews {periodEnd.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {cancelScheduled && periodEnd && (
              <span className="billing-plan__cancel">
                Cancels {periodEnd.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            <span>
              {plan.venturesUsed} of {plan.ventureLimit}{' '}
              {plan.ventureLimit === 1 ? 'venture' : 'ventures'}
            </span>
          </div>
        </div>

        <div className="billing-card__actions">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {tier === 'starter' ? 'Upgrade plan' : 'Change plan'}
          </Button>
          {info?.has_billing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManage}
              disabled={portal.isPending}
              className="gap-1.5"
            >
              {portal.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Manage in Stripe
            </Button>
          )}
        </div>
      </section>

      {/* Payment method */}
      <section className="billing-card">
        <header className="billing-card__head">
          <span className="billing-card__label">Payment method</span>
        </header>

        {info?.payment_method ? (
          <div className="billing-payment">
            <span className="billing-payment__icon">
              <CreditCard className="h-4 w-4" />
            </span>
            <div className="billing-payment__body">
              <p className="billing-payment__title">
                {brandLabel(info.payment_method.brand)} ••••{' '}
                {info.payment_method.last4}
              </p>
              <p className="billing-payment__meta">
                Expires {String(info.payment_method.exp_month).padStart(2, '0')}/
                {String(info.payment_method.exp_year).slice(-2)}
              </p>
            </div>
            <button
              type="button"
              className="billing-payment__update"
              onClick={handleManage}
              disabled={portal.isPending}
            >
              Update
            </button>
          </div>
        ) : (
          <p className="billing-empty">
            {info?.has_billing
              ? 'No payment method on file.'
              : 'Add a payment method by upgrading your plan.'}
          </p>
        )}
      </section>

      {/* Invoice history */}
      <section className="billing-card">
        <header className="billing-card__head">
          <span className="billing-card__label">Invoices</span>
          {info?.invoices && info.invoices.length > 0 && (
            <span className="billing-card__count">
              {info.invoices.length}
            </span>
          )}
        </header>

        {!info?.invoices || info.invoices.length === 0 ? (
          <p className="billing-empty">No invoices yet.</p>
        ) : (
          <ul className="billing-invoices">
            {info.invoices.map((inv) => (
              <li key={inv.id} className="billing-invoice">
                <span className="billing-invoice__icon">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div className="billing-invoice__body">
                  <span className="billing-invoice__date">
                    {new Date(inv.created).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="billing-invoice__number">
                    {inv.number ?? inv.id}
                  </span>
                </div>
                <span className="billing-invoice__amount">
                  ${inv.amount_paid.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'billing-invoice__status',
                    inv.status === 'paid' ? 'is-ok' : 'is-muted'
                  )}
                >
                  {inv.status ?? 'unknown'}
                </span>
                {(inv.hosted_invoice_url || inv.invoice_pdf) && (
                  <a
                    className="billing-invoice__download"
                    href={inv.invoice_pdf ?? inv.hosted_invoice_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    unpaid: 'Unpaid',
  };
  return map[s] ?? s;
}

function brandLabel(brand: string): string {
  const map: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'Amex',
    discover: 'Discover',
    diners: 'Diners',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return map[brand.toLowerCase()] ?? brand;
}
