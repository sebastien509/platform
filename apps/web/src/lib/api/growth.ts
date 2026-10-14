import { apiClient } from './client';
import { GrowthFunction } from '@/lib/types';

export const growthApi = {
  get: (ventureId: string) => 
    apiClient.get<GrowthFunction>(`/ventures/${ventureId}/growth`),
  update: (ventureId: string, data: Partial<GrowthFunction>) =>
    apiClient.patch<GrowthFunction>(`/ventures/${ventureId}/growth`, data),
  createExperiment: (ventureId: string, experiment: any) =>
    apiClient.post(`/ventures/${ventureId}/growth/experiments`, experiment),
  updateExperiment: (ventureId: string, experimentId: string, data: any) =>
    apiClient.patch(`/ventures/${ventureId}/growth/experiments/${experimentId}`, data),
};
