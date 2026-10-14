import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';

interface ArtifactApprovalGateProps {
  onApprove: () => void;
  onRequestRevision: () => void;
  disabled?: boolean;
}

export function ArtifactApprovalGate({
  onApprove,
  onRequestRevision,
  disabled,
}: ArtifactApprovalGateProps) {
  return (
    <div className="artifact-approval-gate">
      <Button
        size="sm"
        onClick={onApprove}
        disabled={disabled}
        className="gap-1.5"
      >
        <Check className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onRequestRevision}
        disabled={disabled}
        className="gap-1.5"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Needs revision
      </Button>
    </div>
  );
}
