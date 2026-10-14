import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Checkpoint } from '@/lib/types';

export const checkpointKeys = {
  all: ['checkpoints'] as const,
  lists: () => [...checkpointKeys.all, 'list'] as const,
  list: () => [...checkpointKeys.lists()] as const,
  pending: () => [...checkpointKeys.all, 'pending'] as const,
  detail: (id: string) => [...checkpointKeys.all, 'detail', id] as const,
};

export function useCheckpoints() {
  return useQuery({
    queryKey: checkpointKeys.list(),
    queryFn: () => apiClient.get<Checkpoint[]>('/checkpoints'),
  });
}

export function usePendingCheckpoints() {
  return useQuery({
    queryKey: checkpointKeys.pending(),
    queryFn: () => apiClient.get<Checkpoint[]>('/checkpoints/pending'),
  });
}

export function useResolveCheckpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: string }) =>
      apiClient.post<Checkpoint>(`/checkpoints/${id}`, { choice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointKeys.pending() });
      queryClient.invalidateQueries({ queryKey: checkpointKeys.list() });
    },
  });
}
