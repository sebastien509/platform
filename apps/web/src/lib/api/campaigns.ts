import { apiClient } from './client';
import { Campaign } from '@/features/campaigns/components/CampaignList';

export const campaignsApi = {
  list: () => apiClient.get<Campaign[]>('/campaigns'),
  get: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`),
  create: (data: Partial<Campaign>) => apiClient.post<Campaign>('/campaigns', data),
  update: (id: string, data: Partial<Campaign>) => apiClient.patch<Campaign>(`/campaigns/${id}`, data),
  delete: (id: string) => apiClient.delete(`/campaigns/${id}`),
};
