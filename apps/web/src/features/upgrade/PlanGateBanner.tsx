import { useNavigate } from 'react-router-dom';
import { Rocket, Zap, ArrowRight } from 'lucide-react';

interface PlanGateBannerProps {
  gateState: 'free_to_pro' | 'pro_to_founder';
  currentVentureName?: string;
  onReviewOptions: () => void;
}

/**
 * PlanGateBanner — the top-of-page awareness banner that primes the
 * founder for the payment gate before they click "Validate & continue."
 *
 * Two states:
 *  · free_to_pro     — the founder is on Free and has 0 ventures.
 *  · pro_to_founder  — the founder is on Pro at the 1-venture limit.
 *
 * Renders in the ValidationStatusBanner slot when gated.
 */
export function PlanGateBanner({
  gateState,
  currentVentureName,
  onReviewOptions,
}: PlanGateBannerProps) {
  const navigate = useNavigate();

  if (gateState === 'free_to_pro') {
    return (
      <div className="plan-gate-banner is-free" role="note">
        <div className="plan-gate-banner__icon">
          <Rocket className="h-4 w-4" />
        </div>
        <div className="plan-gate-banner__body">
          <p className="plan-gate-banner__title">
            The final step — turning this into a venture.
          </p>
          <p className="plan-gate-banner__copy">
            The idea journey is free. Running the venture OS on this idea
            — Strategy, Product, GTM, Sales, and more — requires a plan.
          </p>
        </div>
        <button
          type="button"
          className="plan-gate-banner__cta"
          onClick={() => navigate('/pricing')}
        >
          See plans
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // pro_to_founder
  return (
    <div className="plan-gate-banner is-pro" role="note">
      <div className="plan-gate-banner__icon">
        <Zap className="h-4 w-4" />
      </div>
      <div className="plan-gate-banner__body">
        <p className="plan-gate-banner__title">
          You&rsquo;re on Pro — 1 active venture.
        </p>
        <p className="plan-gate-banner__copy">
          {currentVentureName
            ? `${currentVentureName} holds your slot. Archive it or upgrade to Founder Premium to save this idea as a new venture.`
            : 'Archive your current venture or upgrade to Founder Premium to save this idea as a new venture.'}
        </p>
      </div>
      <button
        type="button"
        className="plan-gate-banner__cta"
        onClick={onReviewOptions}
      >
        Review options
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
