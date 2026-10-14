import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { growthApi } from '@/lib/api/growth';
import { GrowthFunction } from '@/lib/types';

export const growthKeys = {
  all: (ventureId: string) => ['growth', ventureId] as const,
  detail: (ventureId: string) => [...growthKeys.all(ventureId), 'detail'] as const,
  experiments: (ventureId: string) => [...growthKeys.all(ventureId), 'experiments'] as const,
  experiment: (ventureId: string, experimentId: string) => 
    [...growthKeys.experiments(ventureId), experimentId] as const,
};

export function useGrowth(ventureId: string) {
  return useQuery({
    queryKey: growthKeys.detail(ventureId),
    queryFn: () => growthApi.get(ventureId),
    enabled: !!ventureId,
  });
}

export function useUpdateGrowth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, data }: { ventureId: string; data: Partial<GrowthFunction> }) =>
      growthApi.update(ventureId, data),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: growthKeys.detail(ventureId) });
    },
  });
}

export function useCreateGrowthExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, experiment }: { ventureId: string; experiment: any }) =>
      growthApi.createExperiment(ventureId, experiment),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: growthKeys.experiments(ventureId) });
    },
  });
}
