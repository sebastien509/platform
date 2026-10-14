import { apiClient } from './client';
import { Knowledge } from '@/lib/types';

export const knowledgeApi = {
  get: (ventureId: string) => 
    apiClient.get<Knowledge[]>(`/ventures/${ventureId}/knowledge`),
  getItem: (ventureId: string, id: string) => 
    apiClient.get<Knowledge>(`/ventures/${ventureId}/knowledge/${id}`),
  create: (ventureId: string, data: Partial<Knowledge>) =>
    apiClient.post<Knowledge>(`/ventures/${ventureId}/knowledge`, data),
  update: (ventureId: string, id: string, data: Partial<Knowledge>) =>
    apiClient.patch<Knowledge>(`/ventures/${ventureId}/knowledge/${id}`, data),
  archive: (ventureId: string, id: string) =>
    apiClient.post(`/ventures/${ventureId}/knowledge/${id}/archive`),
};
