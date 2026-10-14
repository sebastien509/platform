import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/lib/api/sales';
import { SalesFunction } from '@/lib/types';

export const salesKeys = {
  all: (ventureId: string) => ['sales', ventureId] as const,
  detail: (ventureId: string) => [...salesKeys.all(ventureId), 'detail'] as const,
  prospects: (ventureId: string) => [...salesKeys.all(ventureId), 'prospects'] as const,
  prospect: (ventureId: string, prospectId: string) => 
    [...salesKeys.prospects(ventureId), prospectId] as const,
  pipeline: (ventureId: string) => [...salesKeys.all(ventureId), 'pipeline'] as const,
};

export function useSales(ventureId: string) {
  return useQuery({
    queryKey: salesKeys.detail(ventureId),
    queryFn: () => salesApi.get(ventureId),
    enabled: !!ventureId,
  });
}

export function useUpdateSales() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, data }: { ventureId: string; data: Partial<SalesFunction> }) =>
      salesApi.update(ventureId, data),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(ventureId) });
    },
  });
}

export function useCreateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, prospect }: { ventureId: string; prospect: any }) =>
      salesApi.createProspect(ventureId, prospect),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.prospects(ventureId) });
    },
  });
}
