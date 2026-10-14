import { apiClient } from './client';
import { Idea } from '@/lib/types';

export const ideasApi = {
  list: () => apiClient.get<Idea[]>('/ideas'),
  get: (id: string) => apiClient.get<Idea>(`/ideas/${id}`),
  create: (data: Partial<Idea>) => apiClient.post<Idea>('/ideas', data),
  update: (id: string, data: Partial<Idea>) => apiClient.put<Idea>(`/ideas/${id}`, data),
  delete: (id: string) => apiClient.delete(`/ideas/${id}`)
};
