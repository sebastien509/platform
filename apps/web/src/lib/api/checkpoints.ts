import { apiClient } from './client';
import { Checkpoint } from '@/lib/types';

export const checkpointsApi = {
  listPending: () => apiClient.get<Checkpoint[]>('/checkpoints/pending'),
  resolve: (id: string, choice: string) => 
    apiClient.post<Checkpoint>(`/checkpoints/${id}/resolve`, { choice }),
  get: (id: string) => apiClient.get<Checkpoint>(`/checkpoints/${id}`)
};
