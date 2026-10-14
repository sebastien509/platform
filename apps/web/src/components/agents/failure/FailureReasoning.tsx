import { cn } from '@/lib/utils/cn';
import { CitationStack, Citation } from '../citation';

interface FailureReasoningProps {
  reason: string;
  attempts: number;
  lastAttemptAt: string;
  citations?: Citation[];
  className?: string;
}

export function FailureReasoning({
  reason,
  attempts,
  lastAttemptAt,
  citations,
  className,
}: FailureReasoningProps) {
  return (
    <div className={cn('failure-reasoning', className)}>
      <p className="failure-reasoning__reason">
        <span className="font-medium">Reason:</span> {reason}
      </p>
      <div className="failure-reasoning__meta">
        <span>Attempts: {attempts}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span>Last attempt: {lastAttemptAt}</span>
      </div>
      {citations && citations.length > 0 && (
        <div className="failure-reasoning__citations">
          <CitationStack citations={citations} maxVisible={2} />
        </div>
      )}
    </div>
  );
}
