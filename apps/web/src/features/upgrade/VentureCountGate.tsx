import { useNavigate } from 'react-router-dom';
import { Sparkles, Archive } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';

interface VentureCountGateProps {
  open: boolean;
  onClose: () => void;
  currentVentureName?: string;
  onArchiveCurrent?: () => void;
}

/**
 * VentureCountGate — Pro has 1 active venture.
 * Fires when the founder tries a 2nd.
 * Two paths: archive the current one (free the slot), or upgrade.
 */
export function VentureCountGate({
  open,
  onClose,
  currentVentureName,
  onArchiveCurrent,
}: VentureCountGateProps) {
  const navigate = useNavigate();

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="One venture at a time"
      description="Pro includes a single active venture. Free the slot or upgrade."
      size="md"
    >
      <div className="space-y-5 py-2">
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          {currentVentureName ? (
            <>
              <strong>{currentVentureName}</strong> is your active venture.
              Archive it to start a new one — its history stays available in
              Outcomes.
            </>
          ) : (
            'Pro includes a single active venture. Archive the current one to start a new one, or upgrade for unlimited ventures.'
          )}
        </p>

        <div className="space-y-3">
          {onArchiveCurrent && (
            <button
              type="button"
              onClick={() => {
                onArchiveCurrent();
                onClose();
              }}
              className="flex w-full items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-muted)]">
                <Archive className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Archive {currentVentureName ?? 'the current venture'}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Frees the slot immediately. History stays in Outcomes.
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="flex w-full items-start gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)] p-4 text-left transition-colors hover:bg-[var(--accent-muted)]/70"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Upgrade to Founder Premium
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Unlimited ventures · every op · priority processing · $59/mo
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
