import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Campaign } from '@/features/campaigns/components/CampaignList';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: () => [...campaignKeys.lists()] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.list(),
    queryFn: () => apiClient.get<Campaign[]>('/campaigns'),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => apiClient.get<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Campaign>) => apiClient.post<Campaign>('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      apiClient.patch<Campaign>(`/campaigns/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
