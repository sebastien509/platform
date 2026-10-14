import { apiClient } from './client';
import { AnalyticsFunction } from '@/lib/types';

export const analyticsApi = {
  get: (ventureId: string) => 
    apiClient.get<AnalyticsFunction>(`/ventures/${ventureId}/analytics`),
  update: (ventureId: string, data: Partial<AnalyticsFunction>) =>
    apiClient.patch<AnalyticsFunction>(`/ventures/${ventureId}/analytics`, data),
  getMetrics: (ventureId: string, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get(`/ventures/${ventureId}/analytics/metrics`, params),
};
