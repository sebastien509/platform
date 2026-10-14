import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import {
  PAGE_LABELS,
  pagesUnlockedByUpgrade,
} from '@/lib/config/tiers';

interface PremiumOpGateProps {
  open: boolean;
  onClose: () => void;
  /** The op id (e.g. "engineering.scaffold-repo") — we show its category. */
  opId?: string;
  /** Or the page id (e.g. "engineering"). */
  pageId?: string;
}

/**
 * PremiumOpGate — Pro has 5 op categories; Founder unlocks all 10.
 * Fires when a Pro user tries an op on a Founder-only page.
 */
export function PremiumOpGate({
  open,
  onClose,
  opId,
  pageId,
}: PremiumOpGateProps) {
  const navigate = useNavigate();

  /* Derive the page from opId if pageId not given. */
  const resolvedPage =
    pageId ?? (opId ? opId.split('.')[0] : undefined);
  const pageLabel = resolvedPage
    ? PAGE_LABELS[resolvedPage] ?? resolvedPage
    : 'This';

  /* What does Founder unlock from Pro? */
  const unlocked = pagesUnlockedByUpgrade('pro', 'founder').map(
    (p) => PAGE_LABELS[p] ?? p,
  );

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={`${pageLabel} is a Founder Premium category`}
      description="Pro covers five categories. Founder unlocks the rest."
      size="md"
    >
      <div className="space-y-5 py-2">
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          <strong>{pageLabel}</strong> ops are part of Founder Premium.
          You're on Pro — upgrade to run this and everything else in:
        </p>

        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          {unlocked.map((label) => (
            <li key={label}>✓ {label}</li>
          ))}
        </ul>

        <div className="rounded-xl bg-[var(--surface-2)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Also included:</strong>{' '}
          Unlimited ventures · unlimited deliverable versions · priority
          processing on every run.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Not now
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
            Upgrade to Founder — $59/mo
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
