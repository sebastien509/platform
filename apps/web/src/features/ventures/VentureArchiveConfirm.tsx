import { AlertCircle } from 'lucide-react';

interface VentureArchiveConfirmProps {
  ventureName: string;
}

export function VentureArchiveConfirm({
  ventureName,
}: VentureArchiveConfirmProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-[color-mix(in_srgb,var(--error)_30%,transparent)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] p-3">
        <AlertCircle className="h-5 w-5 text-[var(--error)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--error)]">
            This action cannot be undone.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Archiving <span className="font-medium">{ventureName}</span> will
            preserve its history but remove it from active workspaces.
          </p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        All agents, workflows, and outcomes will be paused. You can unarchive
        later from Settings.
      </p>
    </div>
  );
}
