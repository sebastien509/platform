import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import { PAGE_LABELS } from '@/lib/config/tiers';

interface VersionLimitGateProps {
  open: boolean;
  onClose: () => void;
  opId?: string;
  pageId?: string;
  /** Current limit for the tier (3 for Pro). */
  limit?: number;
}

/**
 * VersionLimitGate — Pro caps at 3 versions per op. This fires
 * when the founder clicks "Update" on a deliverable that has
 * reached its cap.
 */
export function VersionLimitGate({
  open,
  onClose,
  opId,
  pageId,
  limit = 3,
}: VersionLimitGateProps) {
  const navigate = useNavigate();
  const resolvedPage = pageId ?? (opId ? opId.split('.')[0] : undefined);
  const pageLabel = resolvedPage
    ? PAGE_LABELS[resolvedPage] ?? resolvedPage
    : 'This page';

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={`You've hit your version limit`}
      description={`Pro keeps ${limit} versions per op. Founder keeps all of them.`}
      size="md"
    >
      <div className="space-y-5 py-2">
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          You've produced <strong>{limit} versions</strong> of this{' '}
          {pageLabel} op. On Pro, that's the cap — further updates
          would replace the oldest one.
        </p>

        <div className="rounded-xl bg-[var(--surface-2)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">
            Founder Premium includes:
          </strong>
          <ul className="mt-2 space-y-1.5">
            <li>· Unlimited versions per op — full revision history</li>
            <li>· Unlimited ventures</li>
            <li>· Engineering · Growth · Funding ops</li>
            <li>· Priority processing on every run</li>
          </ul>
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
            <Layers className="h-3.5 w-3.5" />
            Upgrade to Founder
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
