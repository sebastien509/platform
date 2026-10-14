import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IdeaJourney } from '@/lib/types';

interface ValidationStatusBannerProps {
  journey: IdeaJourney;
  /** True when the plan is starter and no decision has been made yet. */
  gated?: boolean;
  onUpgrade?: () => void;
}

/**
 * ValidationStatusBanner — a horizontal strip that renders above
 * the decision cards. Communicates the current state without
 * replacing the layout.
 *
 * States:
 *   · validating (default) → renders nothing
 *   · validated            → green banner, CTA to venture
 *   · killed               → muted banner, archived note
 *   · gated                → accent banner, upgrade CTA
 */
export function ValidationStatusBanner({
  journey,
  gated = false,
  onUpgrade,
}: ValidationStatusBannerProps) {
  const navigate = useNavigate();

  const isKilled = journey.validation.decision === 'kill';
  const isValidated =
    journey.validation.decision === 'continue' ||
    Boolean(journey.createdVentureId);

  /* Gated — non-pro, no decision yet */
  if (gated && !isValidated && !isKilled) {
    return (
      <div className="validation-status validation-status--gated">
        <span className="validation-status__icon">
          <Lock className="h-4 w-4" />
        </span>
        <div className="validation-status__body">
          <p className="validation-status__title">
            Validation is a Pro feature
          </p>
          <p className="validation-status__copy">
            Upgrade to make the decision and turn this idea into a venture.
          </p>
        </div>
        <div className="validation-status__actions">
          <Button
            size="sm"
            onClick={onUpgrade ?? (() => navigate('/pricing'))}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  /* Validated — decided continue */
  if (isValidated) {
    const ventureId = journey.createdVentureId;
    return (
      <div className="validation-status validation-status--validated">
        <span className="validation-status__icon">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div className="validation-status__body">
          <p className="validation-status__title">
            Validated — this idea became a venture
          </p>
          <p className="validation-status__copy">
            {journey.validation.decidedAt
              ? `Decision recorded on ${new Date(
                  journey.validation.decidedAt,
                ).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}. `
              : ''}
            All further work happens inside the venture.
          </p>
        </div>
        <div className="validation-status__actions">
          <Button
            size="sm"
            onClick={() =>
              navigate(ventureId ? `/ventures/${ventureId}` : '/ventures')
            }
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {ventureId ? 'Open venture' : 'View ventures'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  /* Killed */
  if (isKilled) {
    return (
      <div className="validation-status validation-status--killed">
        <span className="validation-status__icon">
          <XCircle className="h-4 w-4" />
        </span>
        <div className="validation-status__body">
          <p className="validation-status__title">Killed — archived</p>
          <p className="validation-status__copy">
            {journey.validation.note
              ? journey.validation.note
              : 'This idea was archived. The record below is preserved for reference.'}
          </p>
        </div>
      </div>
    );
  }

  /* Default: validating, no banner */
  return null;
}
