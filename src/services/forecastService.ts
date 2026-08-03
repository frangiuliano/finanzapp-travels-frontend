import api from './api';
import type { HomeMonthView } from '@/lib/expense-month-attribution';
import type { MonthlyForecast } from '@/types/forecast';
import type {
  ExpenseSimulationResult,
  SimulateExpenseInput,
} from '@/types/expense-simulation';

export const forecastService = {
  async getMonthlyForecast(
    boardId: string,
    yearMonth: string,
    attribution: HomeMonthView = 'cash_impact',
  ): Promise<{ forecast: MonthlyForecast }> {
    const params = new URLSearchParams({ boardId, yearMonth, attribution });
    const response = await api.get(`/forecast/monthly?${params.toString()}`);
    return response.data;
  },

  async simulateExpense(
    input: SimulateExpenseInput,
  ): Promise<{ simulation: ExpenseSimulationResult }> {
    const response = await api.post('/forecast/simulate-expense', input);
    return response.data;
  },

  async ensureHorizon(
    boardId: string,
    monthsAhead?: number,
  ): Promise<{ message: string; generated: number; horizonEnd: string }> {
    const params = new URLSearchParams({ boardId });
    if (monthsAhead != null) {
      params.set('monthsAhead', String(monthsAhead));
    }
    const response = await api.post(
      `/forecast/ensure-horizon?${params.toString()}`,
    );
    return response.data;
  },
};
