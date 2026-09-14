import api from './api';
import type { MonthlyInsightsResponse } from '@/types/insight';

export const insightsService = {
  async getMonthlyInsights(
    boardId: string,
    yearMonth: string,
  ): Promise<{ insights: MonthlyInsightsResponse }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(`/reports/insights?${params.toString()}`);
    return response.data;
  },
};
