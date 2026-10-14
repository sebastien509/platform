import { useNavigate } from 'react-router-dom';
import { Sparkles, Users } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';

interface TeamInviteGateProps {
  open: boolean;
  onClose: () => void;
}

/**
 * TeamInviteGate — only Team tier can invite members.
 * Fires when a Founder user clicks the Invite button.
 */
export function TeamInviteGate({ open, onClose }: TeamInviteGateProps) {
  const navigate = useNavigate();

  return (
    <ModalShell
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Bring your team in"
      description="Team access is $149/mo — everything in Founder Premium, plus seats."
      size="md"
    >
      <div className="space-y-5 py-2">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--accent-muted)] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Team is Founder Premium + people
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Everything unlocks. Your whole team builds with you.
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>✓ Everything in Founder Premium</li>
          <li>✓ Invite up to 10 teammates</li>
          <li>✓ Roles — owner, admin, member, viewer</li>
          <li>✓ Shared ventures, deliverables, comments</li>
          <li>✓ Notification routing per member</li>
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
            Upgrade to Team
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
