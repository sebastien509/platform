'use client';

import { usePendingCheckpoints, useResolveCheckpoint } from '@/lib/hooks/useCheckpoints';
import { CheckpointCard } from './CheckpointCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export function CheckpointQueue() {
  const { data, isLoading, error } = usePendingCheckpoints();
  const resolveCheckpoint = useResolveCheckpoint();

  if (isLoading) return <LoadingSkeleton count={2} />;
  if (error) return <div className="text-sm text-red-600">Failed to load checkpoints</div>;

  const checkpoints = data?.data || [];

  if (checkpoints.length === 0) {
    return (
      <EmptyState
        title="No pending checkpoints"
        description="All checkpoints have been resolved. Keep building!"
        icon="✅"
      />
    );
  }

  return (
    <div className="space-y-4">
      {checkpoints.map((checkpoint) => (
        <CheckpointCard
          key={checkpoint.id}
          checkpoint={checkpoint}
          onResolve={(choice) => resolveCheckpoint.mutate({ id: checkpoint.id, choice })}
        />
      ))}
    </div>
  );
}
