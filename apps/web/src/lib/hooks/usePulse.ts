import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PulseItemData } from '@/components/pulse/PulseItem';

export const pulseKeys = {
  all: ['pulse'] as const,
  list: () => [...pulseKeys.all, 'list'] as const,
};

export function usePulse() {
  return useQuery({
    queryKey: pulseKeys.list(),
    queryFn: () => apiClient.get<PulseItemData[]>('/pulse'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
