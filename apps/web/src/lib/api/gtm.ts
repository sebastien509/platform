import { apiClient } from './client';
import { GTMFunction } from '@/lib/types';

export const gtmApi = {
  get: (ventureId: string) => 
    apiClient.get<GTMFunction>(`/ventures/${ventureId}/gtm`),
  update: (ventureId: string, data: Partial<GTMFunction>) =>
    apiClient.patch<GTMFunction>(`/ventures/${ventureId}/gtm`, data),
  createExperiment: (ventureId: string, experiment: any) =>
    apiClient.post(`/ventures/${ventureId}/gtm/experiments`, experiment),
  updateExperiment: (ventureId: string, experimentId: string, data: any) =>
    apiClient.patch(`/ventures/${ventureId}/gtm/experiments/${experimentId}`, data),
};
