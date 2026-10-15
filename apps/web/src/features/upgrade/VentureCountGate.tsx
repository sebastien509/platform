import { useNavigate } from 'react-router-dom';
import { Rocket, Zap, ArrowRight, Archive, Crown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export type GateState = 'none' | 'free_to_pro' | 'pro_to_founder';

interface VentureCountGateProps {
  open: boolean;
  onClose: () => void;
  gateState: GateState;
  /** Only used when gateState === 'pro_to_founder' */
  currentVentureName?: string;
  currentVentureId?: string;
  /** Fires when the founder chooses "Archive & save this" */
  onArchiveAndSave?: () => void | Promise<void>;
  /** Fires when the founder chooses "Upgrade to Founder Premium" */
  onUpgrade?: () => void;
}

/**
 * VentureCountGate — the plan-aware payment gate.
 *
 * Two states:
 *  · free_to_pro     — the founder has no ventures. The gate explains
 *                       what Pro unlocks and sends them to /billing.
 *  · pro_to_founder  — the founder is on Pro at the venture limit.
 *                       They either archive the current venture or
 *                       upgrade to Founder Premium.
 */
export function VentureCountGate({
  open,
  onClose,
  gateState,
  currentVentureName,
  onArchiveAndSave,
  onUpgrade,
}: VentureCountGateProps) {
  const navigate = useNavigate();

  if (gateState === 'free_to_pro') {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="venture-gate">
          <div className="venture-gate__icon">
            <Rocket className="h-5 w-5" />
          </div>

          <h2 className="venture-gate__title">Your idea is ready.</h2>

          <p className="venture-gate__lead">
            The idea journey is free — one idea, fully researched, sharpened.
            Turning it into a venture is where IV does its real work.
          </p>

          <p className="venture-gate__subhead">
            Pro unlocks the venture operating system:
          </p>

          <ul className="venture-gate__features">
            <li>Strategy · Product · GTM · Campaigns · Sales</li>
            <li>Full research engine</li>
            <li>3 deliverable versions per op</li>
            <li>Gmail · Slack · Notion · GitHub · Vercel</li>
          </ul>

          <p className="venture-gate__meta">
            One active venture at a time. $29/mo. Cancel anytime.
          </p>

          <div className="venture-gate__actions">
            <button
              type="button"
              className="venture-gate__btn venture-gate__btn--primary"
              onClick={() => navigate('/pricing')}
            >
              Choose a plan
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="venture-gate__btn venture-gate__btn--ghost"
              onClick={onClose}
            >
              Keep this as an idea for now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // pro_to_founder
  const ventureLabel = currentVentureName ?? 'Your current venture';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="venture-gate">
        <div className="venture-gate__icon">
          <Zap className="h-5 w-5" />
        </div>

        <h2 className="venture-gate__title">
          You&rsquo;re on Pro. One active venture at a time.
        </h2>

        <p className="venture-gate__lead">
          {ventureLabel} holds your slot right now. Two paths:
        </p>

        <div className="venture-gate__options">
          <div className="venture-gate__option">
            <div className="venture-gate__option-head">
              <Archive className="h-3.5 w-3.5" />
              <span>Archive {ventureLabel}</span>
            </div>
            <p className="venture-gate__option-copy">
              Frees your venture slot. The record is preserved in the DB,
              but {ventureLabel} is no longer active on the platform.
              You save this idea as your new active venture.
            </p>
          </div>

          <div className="venture-gate__option is-recommended">
            <div className="venture-gate__option-head">
              <Crown className="h-3.5 w-3.5" />
              <span>Upgrade to Founder Premium — $59/mo</span>
            </div>
            <p className="venture-gate__option-copy">
              Unlimited ventures. Every op — including Engineering, Growth,
              Funding, Analytics. Priority processing. Unlimited
              deliverable versions.
            </p>
          </div>
        </div>

        <div className="venture-gate__actions">
          <button
            type="button"
            className="venture-gate__btn venture-gate__btn--primary"
            onClick={() => onArchiveAndSave?.()}
          >
            Archive {ventureLabel} &amp; save this
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="venture-gate__btn venture-gate__btn--secondary"
            onClick={() => onUpgrade?.()}
          >
            Upgrade to Founder Premium — $59/mo
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="venture-gate__btn venture-gate__btn--ghost"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
