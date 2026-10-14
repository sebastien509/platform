import { apiClient } from './client';
import { Knowledge } from '@/lib/types';

export const libraryApi = {
  list: () => apiClient.get<Knowledge[]>('/library'),
  search: (query: string) => apiClient.get<Knowledge[]>(`/library/search?q=${query}`),
  get: (id: string) => apiClient.get<Knowledge>(`/library/${id}`)
};
