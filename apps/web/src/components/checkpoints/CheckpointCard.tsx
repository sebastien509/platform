'use client';

import { Checkpoint, CheckpointOption } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { CheckpointStatusBadge } from './CheckpointStatusBadge';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  onResolve?: (choice: string) => void;
  className?: string;
}

export function CheckpointCard({ checkpoint, onResolve, className }: CheckpointCardProps) {
  const isPending = checkpoint.status === 'pending';

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{checkpoint.title}</h4>
            <CheckpointStatusBadge status={checkpoint.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{checkpoint.description}</p>
        </div>
        {checkpoint.expiresAt && (
          <span className="text-xs text-muted-foreground">
            Expires {formatDate(checkpoint.expiresAt)}
          </span>
        )}
      </div>

      {checkpoint.evidence.length > 0 && (
        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Evidence</p>
          <ul className="mt-1 space-y-1">
            {checkpoint.evidence.map((ev) => (
              <li key={ev.id} className="text-sm text-foreground">
                • {ev.title} <span className="text-muted-foreground">({ev.confidence}% confidence)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPending && onResolve && (
        <div className="mt-4 flex flex-wrap gap-2">
          {checkpoint.options.map((option: CheckpointOption) => (
            <button
              key={option.value}
              onClick={() => onResolve(option.value)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                option.action === 'approve' && 'bg-green-600 text-white hover:bg-green-700',
                option.action === 'reject' && 'bg-red-600 text-white hover:bg-red-700',
                option.action === 'defer' && 'bg-amber-600 text-white hover:bg-amber-700',
                option.action === 'modify' && 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {!isPending && checkpoint.resolvedChoice && (
        <div className="mt-3 text-sm text-muted-foreground">
          Resolved: {checkpoint.resolvedChoice}
          {checkpoint.resolvedAt && ` at ${formatDate(checkpoint.resolvedAt)}`}
        </div>
      )}
    </div>
  );
}
