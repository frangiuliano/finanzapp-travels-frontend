import api from './api';
import type { MonthlyForecast } from '@/types/forecast';
import type {
  ExpenseSimulationResult,
  SimulateExpenseInput,
} from '@/types/expense-simulation';

export const forecastService = {
  async getMonthlyForecast(
    boardId: string,
    yearMonth: string,
  ): Promise<{ forecast: MonthlyForecast }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(`/forecast/monthly?${params.toString()}`);
    return response.data;
  },

  async simulateExpense(
    input: SimulateExpenseInput,
  ): Promise<{ simulation: ExpenseSimulationResult }> {
    const response = await api.post('/forecast/simulate-expense', input);
    return response.data;
  },
};
