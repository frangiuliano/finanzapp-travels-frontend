import api from './api';
import type {
  CreateIncomeDto,
  Income,
  MonthlyBoardSummary,
} from '@/types/income';

export const incomesService = {
  async createIncome(
    data: CreateIncomeDto,
  ): Promise<{ message: string; income: Income }> {
    const response = await api.post('/incomes', data);
    return response.data;
  },

  async getIncomes(boardId: string): Promise<{ incomes: Income[] }> {
    const response = await api.get(`/incomes?boardId=${boardId}`);
    return response.data;
  },

  async getMonthlySummary(
    boardId: string,
    yearMonth: string,
  ): Promise<{ summary: MonthlyBoardSummary }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(`/incomes/summary?${params.toString()}`);
    return response.data;
  },
};
