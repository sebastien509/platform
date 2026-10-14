import { apiClient } from './client';
import { Outcome } from '@/lib/types';

export const outcomesApi = {
  list: () => apiClient.get<Outcome[]>('/outcomes'),
  get: (id: string) => apiClient.get<Outcome>(`/outcomes/${id}`)
};
