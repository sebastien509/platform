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
 * Existing venture-limit decision modal, with mobile layout hooks.
 * Archive and upgrade callbacks remain identical to the current behavior.
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
      <div className="venture-count-gate space-y-5 py-2">
        <p className="venture-count-gate__description text-sm leading-relaxed text-[var(--text-primary)]">
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

        <div className="venture-count-gate__choices space-y-3">
          {onArchiveCurrent && (
            <button
              type="button"
              onClick={() => {
                onArchiveCurrent();
                onClose();
              }}
              className="venture-count-gate__choice flex w-full items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30"
            >
              <span className="venture-count-gate__icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-muted)]">
                <Archive className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="venture-count-gate__choice-body">
                <span className="venture-count-gate__choice-title text-sm font-medium text-[var(--text-primary)]">
                  Archive {currentVentureName ?? 'the current venture'}
                </span>
                <span className="venture-count-gate__choice-copy mt-0.5 text-xs text-[var(--text-secondary)]">
                  Frees the slot immediately. History stays in Outcomes.
                </span>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="venture-count-gate__choice venture-count-gate__choice--upgrade flex w-full items-start gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)] p-4 text-left transition-colors hover:bg-[var(--accent-muted)]/70"
          >
            <span className="venture-count-gate__icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="venture-count-gate__choice-body">
              <span className="venture-count-gate__choice-title text-sm font-medium text-[var(--text-primary)]">
                Upgrade to Founder Premium
              </span>
              <span className="venture-count-gate__choice-copy mt-0.5 text-xs text-[var(--text-secondary)]">
                Unlimited ventures · every op · priority processing · $59/mo
              </span>
            </span>
          </button>
        </div>

        <div className="venture-count-gate__footer flex items-center justify-end pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
