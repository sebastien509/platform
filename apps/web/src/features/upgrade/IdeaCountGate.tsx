import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';

interface IdeaCountGateProps {
  open: boolean;
  onClose: () => void;
}

/**
 * IdeaCountGate — Free tier is capped at 1 idea.
 * Fires when the founder tries to create a 2nd.
 */
export function IdeaCountGate({ open, onClose }: IdeaCountGateProps) {
  const navigate = useNavigate();

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="You're on a roll"
      description="Free includes one idea — the full journey from capture to validated card."
      size="md"
    >
      <div className="space-y-5 py-2">
        <div className="rounded-xl bg-[var(--accent-muted)] p-4">
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Your first idea runs the entire agent pipeline — capture,
            clean, research, synthesize. To start a second, upgrade to
            <strong> Pro</strong>: unlimited ideas, one active venture,
            and every standard op.
          </p>
        </div>

        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>✓ Unlimited ideas</li>
          <li>✓ One active venture, run in full</li>
          <li>✓ Every standard op + research depth</li>
          <li>✓ Deliverable version history</li>
        </ul>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Not yet
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
