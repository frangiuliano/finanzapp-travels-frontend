import api from './api';
import type { MonthlyForecast } from '@/types/forecast';

export const forecastService = {
  async getMonthlyForecast(
    boardId: string,
    yearMonth: string,
  ): Promise<{ forecast: MonthlyForecast }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(`/forecast/monthly?${params.toString()}`);
    return response.data;
  },
};
