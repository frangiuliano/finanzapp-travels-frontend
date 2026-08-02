import api from './api';
import type {
  CreateIncomeDto,
  Income,
  MonthlyBoardSummary,
  UpdateIncomeDto,
} from '@/types/income';

export const incomesService = {
  async createIncome(
    data: CreateIncomeDto,
  ): Promise<{ message: string; income: Income }> {
    const response = await api.post('/incomes', data);
    return response.data;
  },

  async getIncomes(boardId: string): Promise<{ incomes: Income[] }> {
    const params = new URLSearchParams({ boardId });
    const response = await api.get(`/incomes?${params.toString()}`);
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

  async updateIncome(
    id: string,
    data: UpdateIncomeDto,
  ): Promise<{ message: string; income: Income }> {
    const response = await api.patch(`/incomes/${id}`, data);
    return response.data;
  },

  async deleteIncome(id: string): Promise<void> {
    await api.delete(`/incomes/${id}`);
  },
};
