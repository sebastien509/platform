import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspacePlan } from '@/lib/types';

interface MonetizationGateProps {
  plan: WorkspacePlan;
  onUpgrade?: () => void;
  onKeepResearching?: () => void;
}

/**
 * MonetizationGate — the upgrade entry point.
 *
 * Thin horizontal bar. Fires when the founder's plan is
 * exhausted. The primary CTA opens /pricing where the founder
 * picks a tier and pays through Stripe Checkout.
 */
export function MonetizationGate({
  plan,
  onUpgrade,
  onKeepResearching,
}: MonetizationGateProps) {
  const navigate = useNavigate();
  const exhausted = plan.venturesUsed >= plan.ventureLimit;

  if (!exhausted) return null;

  const usedBy = plan.ventureNames[0] ?? 'your current venture';
  const isPaid = plan.tier === 'pro' || plan.tier === 'founder' || plan.tier === 'team';

  function handleUpgrade() {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    navigate('/pricing');
  }

  return (
    <div className="upgrade-bar">
      <span className="upgrade-bar__icon">
        <TrendingUp className="h-4 w-4" />
      </span>

      <div className="upgrade-bar__body">
        <div className="upgrade-bar__title-row">
          <span className="upgrade-bar__title">Ready for another venture</span>
          <span className="upgrade-bar__tier">{plan.tier}</span>
        </div>
        <p className="upgrade-bar__copy">
          Your {plan.tier} plan includes {plan.ventureLimit}{' '}
          {plan.ventureLimit === 1 ? 'venture' : 'ventures'}, already in use by{' '}
          {usedBy}.
          {isPaid
            ? ' Upgrade to a higher tier to keep going.'
            : ' Upgrade to validate this idea too.'}
        </p>
      </div>

      <div className="upgrade-bar__actions">
        {onKeepResearching && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onKeepResearching}
            className="gap-1.5"
          >
            Keep researching
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" onClick={handleUpgrade} className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {isPaid ? 'Change plan' : 'See plans'}
        </Button>
      </div>
    </div>
  );
}
