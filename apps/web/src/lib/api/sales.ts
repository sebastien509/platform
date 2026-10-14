import { apiClient } from './client';
import { SalesFunction } from '@/lib/types';

export const salesApi = {
  get: (ventureId: string) => 
    apiClient.get<SalesFunction>(`/ventures/${ventureId}/sales`),
  update: (ventureId: string, data: Partial<SalesFunction>) =>
    apiClient.patch<SalesFunction>(`/ventures/${ventureId}/sales`, data),
  createProspect: (ventureId: string, prospect: any) =>
    apiClient.post(`/ventures/${ventureId}/sales/prospects`, prospect),
  updateProspect: (ventureId: string, prospectId: string, data: any) =>
    apiClient.patch(`/ventures/${ventureId}/sales/prospects/${prospectId}`, data),
  createPipelineItem: (ventureId: string, item: any) =>
    apiClient.post(`/ventures/${ventureId}/sales/pipeline`, item),
};
