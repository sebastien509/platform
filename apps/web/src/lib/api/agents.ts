import { apiClient } from './client';
import { Agent } from '@/lib/types';

export const agentsApi = {
  list: () => apiClient.get<Agent[]>('/agents'),
  get: (id: string) => apiClient.get<Agent>(`/agents/${id}`),
  getActivity: (id: string) => apiClient.get(`/agents/${id}/activity`)
};


