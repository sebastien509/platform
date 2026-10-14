import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { useCurrentWorkspace } from '@/lib/hooks/useWorkspace';
import { useUpgrade } from '@/lib/hooks/useUpgrade';
import { useBillingPortal } from '@/lib/hooks/useBillingPortal';
import { useWorkspacePlan } from '@/lib/hooks/useWorkspacePlan';
import {
  TIER_CONFIG,
  DB_TIER_TO_KEY,
  KEY_TO_DB_TIER,
  type TierKey,
} from '@/lib/config/tiers';
import { cn } from '@/lib/utils/cn';
import { Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';

/* ============================================================
   Pricing page.

   Signed out     → every CTA routes to /login?next=/pricing
   Signed in      → CTA per tier (Current / Upgrade / Downgrade)
   Founder Premium is badged "Best value for founders".
   ============================================================ */

interface CardDef {
  key: TierKey;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  highlightLabel?: string;
}

const CARDS: CardDef[] = [
  {
    key: 'free',
    name: TIER_CONFIG.free.label,
    price: '$0',
    cadence: '',
    tagline: TIER_CONFIG.free.tagline,
    features: TIER_CONFIG.free.features,
  },
  {
    key: 'pro',
    name: TIER_CONFIG.pro.label,
    price: `$${TIER_CONFIG.pro.pricePerMonth}`,
    cadence: '/mo',
    tagline: TIER_CONFIG.pro.tagline,
    features: TIER_CONFIG.pro.features,
  },
  {
    key: 'founder',
    name: TIER_CONFIG.founder.label,
    price: `$${TIER_CONFIG.founder.pricePerMonth}`,
    cadence: '/mo',
    tagline: TIER_CONFIG.founder.tagline,
    highlightLabel: 'Best value for founders',
    features: TIER_CONFIG.founder.features,
  },
  {
    key: 'team',
    name: TIER_CONFIG.team.label,
    price: `$${TIER_CONFIG.team.pricePerMonth}`,
    cadence: '/mo',
    tagline: TIER_CONFIG.team.tagline,
    features: TIER_CONFIG.team.features,
  },
];

type CtaKind = 'current' | 'upgrade' | 'downgrade' | 'signin';

interface Cta {
  kind: CtaKind;
  label: string;
}

function ctaFor(tier: TierKey, current: TierKey | null): Cta {
  /* Signed out — everything routes to sign in. */
  if (!current) {
    if (tier === 'free') return { kind: 'signin', label: 'Start free' };
    if (tier === 'pro') return { kind: 'signin', label: 'Get Pro' };
    if (tier === 'founder') return { kind: 'signin', label: 'Go Founder' };
    return { kind: 'signin', label: 'Go Team' };
  }

  /* Signed in — compare tier rank. */
  const RANK: Record<TierKey, number> = {
    free: 0,
    pro: 1,
    founder: 2,
    team: 3,
  };
  const myRank = RANK[current];
  const theirRank = RANK[tier];

  if (theirRank === myRank) return { kind: 'current', label: 'Current plan' };

  if (theirRank > myRank) {
    if (tier === 'pro') return { kind: 'upgrade', label: 'Upgrade to Pro' };
    if (tier === 'founder')
      return { kind: 'upgrade', label: 'Upgrade to Founder' };
    return { kind: 'upgrade', label: 'Upgrade to Team' };
  }

  /* Downgrade. */
  if (tier === 'free') return { kind: 'downgrade', label: 'Downgrade to Free' };
  if (tier === 'pro') return { kind: 'downgrade', label: 'Switch to Pro' };
  if (tier === 'founder')
    return { kind: 'downgrade', label: 'Switch to Founder' };
  return { kind: 'downgrade', label: 'Switch to Team' };
}

export default function PricingPage() {
  const navigate = useNavigate();
  const workspace = useCurrentWorkspace();
  const upgrade = useUpgrade();
  const portal = useBillingPortal();
  const { plan, config } = useWorkspacePlan();

  const [error, setError] = useState<string | null>(null);
  const [busyTier, setBusyTier] = useState<TierKey | null>(null);

  const signedIn = Boolean(workspace.data?.id);
  const rawTier = (workspace.data as any)?.plan_tier ?? 'starter';
  const currentTier: TierKey | null = signedIn
    ? DB_TIER_TO_KEY[rawTier] ?? 'free'
    : null;
  const hasBilling = Boolean((workspace.data as any)?.stripe_customer_id);

  async function handleCta(tier: TierKey, kind: CtaKind) {
    setError(null);

    if (kind === 'current') return;

    if (kind === 'signin') {
      navigate(`/login?next=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (!workspace.data?.id) {
      navigate(`/login?next=${encodeURIComponent('/pricing')}`);
      return;
    }

    setBusyTier(tier);

    try {
      if (kind === 'downgrade') {
        /* Any plan change on an existing subscription goes through
           the Stripe customer portal. Stripe handles proration. */
        if (!hasBilling) {
          /* No subscription to downgrade — just navigate them to
             billing to see their state. */
          navigate('/billing');
          return;
        }
        await portal.mutateAsync({ workspaceId: workspace.data.id });
        return;
      }

      /* Upgrade. Two paths:
         · existing subscriber  → Stripe portal (change plan)
         · no subscription      → Stripe Checkout (new session) */
      if (hasBilling && currentTier && currentTier !== 'free') {
        await portal.mutateAsync({ workspaceId: workspace.data.id });
        return;
      }

      await upgrade.mutateAsync({
        workspaceId: workspace.data.id,
        tier: KEY_TO_DB_TIER[tier] as 'pro' | 'founder' | 'team',
        returnPath: '/billing?upgraded=1',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusyTier(null);
    }
  }

  return (
    <PageContainer>
      <header className="pricing-hero">
        <span className="pricing-hero__eyebrow">
          {signedIn ? 'Plans & pricing' : 'Built for founders who ship'}
        </span>
        <h1 className="pricing-hero__title">
          {signedIn
            ? `You're on ${config.label}`
            : 'Start free. Upgrade when it earns it.'}
        </h1>
        <p className="pricing-hero__lede">
          {signedIn
            ? 'Choose an upgrade or stay where you are — every plan keeps your work.'
            : 'The entire idea-shaping pipeline is free. Pay only when you turn an idea into a venture.'}
        </p>
        {signedIn && (
          <p className="pricing-hero__meta">
            {plan.venturesUsed} of{' '}
            {plan.ventureLimit >= 999 ? '∞' : plan.ventureLimit}{' '}
            {plan.ventureLimit === 1 ? 'venture' : 'ventures'} in use
          </p>
        )}
      </header>

      {error && (
        <div className="pricing-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="pricing-grid">
        {CARDS.map((card) => {
          const cta = ctaFor(card.key, currentTier);
          const isCurrent = cta.kind === 'current';
          const isHighlight = Boolean(card.highlightLabel);
          const busy = busyTier === card.key;

          return (
            <article
              key={card.key}
              className={cn(
                'pricing-card',
                isHighlight && 'is-highlight',
                isCurrent && 'is-current',
              )}
            >
              {card.highlightLabel && (
                <span className="pricing-card__badge">
                  <Sparkles className="h-3 w-3" />
                  {card.highlightLabel}
                </span>
              )}
              {isCurrent && (
                <span className="pricing-card__current-badge">
                  <Check className="h-3 w-3" />
                  Your plan
                </span>
              )}

              <div className="pricing-card__head">
                <h3 className="pricing-card__name">{card.name}</h3>
                <div className="pricing-card__price">
                  <span className="pricing-card__amount">{card.price}</span>
                  {card.cadence && (
                    <span className="pricing-card__cadence">{card.cadence}</span>
                  )}
                </div>
                <p className="pricing-card__tagline">{card.tagline}</p>
              </div>

              <ul className="pricing-card__features">
                {card.features.map((f) => (
                  <li key={f} className="pricing-card__feature">
                    <span className="pricing-card__check">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="pricing-card__cta">
                <Button
                  size="sm"
                  variant={
                    isCurrent
                      ? 'ghost'
                      : cta.kind === 'signin' || cta.kind === 'upgrade'
                        ? 'default'
                        : 'outline'
                  }
                  onClick={() => handleCta(card.key, cta.kind)}
                  disabled={isCurrent || busy}
                  className="w-full gap-1.5"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {cta.label}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="pricing-footnote">
        Every plan includes the idea journey. Cancel anytime from your billing
        page — no questions asked.
      </p>
    </PageContainer>
  );
}
