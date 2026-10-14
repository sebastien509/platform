import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspacePlan } from '@/lib/types';

interface ValidationGateProps {
  plan: WorkspacePlan;
  ideaTitle?: string;
  /** Where "back" goes. Defaults to /ideas. */
  onBack?: () => void;
  /** Where "keep researching" goes. */
  onKeepResearching?: () => void;
}

/**
 * ValidationGate — the membership wall.
 *
 * Fires when a non-Pro founder lands on the validation step.
 * Validation (decision-making) is a paid feature; research is free.
 */
export function ValidationGate({
  plan,
  ideaTitle,
  onBack,
  onKeepResearching,
}: ValidationGateProps) {
  const navigate = useNavigate();

  function handleUpgrade() {
    navigate('/pricing');
  }

  function handleBack() {
    if (onBack) return onBack();
    navigate('/ideas');
  }

  function handleKeepResearching() {
    if (onKeepResearching) return onKeepResearching();
    /* Default: send them back to the idea so they can re-open
     * the research stage. */
    navigate(-1);
  }

  const unlockList = [
    'Make the continue / kill decision',
    'Turn validated ideas into real ventures',
    'Unlock the full agent team across every page',
    'Version history + rollback on every deliverable',
  ];

  return (
    <div className="validation-gate">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="validation-gate__panel"
      >
        <button
          type="button"
          onClick={handleBack}
          className="validation-gate__back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to ideas
        </button>

        <div className="validation-gate__icon">
          <Lock className="h-5 w-5" />
        </div>

        <p className="validation-gate__eyebrow">
          Validation · Pro feature
        </p>
        <h1 className="validation-gate__title">
          Ready to decide?
        </h1>
        <p className="validation-gate__lede">
          {ideaTitle
            ? `"${ideaTitle}" has finished its research.`
            : 'This idea has finished its research.'}{' '}
          Upgrade to validate it and turn it into a venture.
        </p>

        <ul className="validation-gate__list">
          {unlockList.map((item) => (
            <li key={item} className="validation-gate__item">
              <span className="validation-gate__check">
                <Check className="h-3 w-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="validation-gate__actions">
          <Button
            size="lg"
            onClick={handleUpgrade}
            className="validation-gate__cta"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleKeepResearching}
            className="gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            Keep researching
          </Button>
        </div>

        <p className="validation-gate__footnote">
          You're on the <strong>{plan.tier}</strong> plan. Upgrade anytime —
          cancel whenever.
        </p>
      </motion.div>
    </div>
  );
}
