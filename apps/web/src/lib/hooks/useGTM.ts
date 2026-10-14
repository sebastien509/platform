import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gtmApi } from '@/lib/api/gtm';
import { GTMFunction } from '@/lib/types';

export const gtmKeys = {
  all: (ventureId: string) => ['gtm', ventureId] as const,
  detail: (ventureId: string) => [...gtmKeys.all(ventureId), 'detail'] as const,
  experiments: (ventureId: string) => [...gtmKeys.all(ventureId), 'experiments'] as const,
  experiment: (ventureId: string, experimentId: string) => 
    [...gtmKeys.experiments(ventureId), experimentId] as const,
};

export function useGTM(ventureId: string) {
  return useQuery({
    queryKey: gtmKeys.detail(ventureId),
    queryFn: () => gtmApi.get(ventureId),
    enabled: !!ventureId,
  });
}

export function useUpdateGTM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, data }: { ventureId: string; data: Partial<GTMFunction> }) =>
      gtmApi.update(ventureId, data),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: gtmKeys.detail(ventureId) });
    },
  });
}

export function useCreateGTMExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, experiment }: { ventureId: string; experiment: any }) =>
      gtmApi.createExperiment(ventureId, experiment),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: gtmKeys.experiments(ventureId) });
    },
  });
}
