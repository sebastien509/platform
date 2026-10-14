import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { AnalyticsFunction } from '@/lib/types';

export const analyticsKeys = {
  all: (ventureId: string) => ['analytics', ventureId] as const,
  detail: (ventureId: string) => [...analyticsKeys.all(ventureId), 'detail'] as const,
  metrics: (ventureId: string, params?: Record<string, string>) => 
    [...analyticsKeys.all(ventureId), 'metrics', params] as const,
};

export function useAnalytics(ventureId: string) {
  return useQuery({
    queryKey: analyticsKeys.detail(ventureId),
    queryFn: () => analyticsApi.get(ventureId),
    enabled: !!ventureId,
  });
}

export function useUpdateAnalytics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventureId, data }: { ventureId: string; data: Partial<AnalyticsFunction> }) =>
      analyticsApi.update(ventureId, data),
    onSuccess: (_, { ventureId }) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.detail(ventureId) });
    },
  });
}

export function useAnalyticsMetrics(ventureId: string, params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: analyticsKeys.metrics(ventureId, params),
    queryFn: () => analyticsApi.getMetrics(ventureId, params),
    enabled: !!ventureId,
  });
}
