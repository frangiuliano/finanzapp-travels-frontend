import api from './api';
import type {
  CreateRecurringIncomeDto,
  RecurringIncome,
  UpdateRecurringIncomeDto,
} from '@/types/recurring-income';

export const recurringIncomesService = {
  async create(
    data: CreateRecurringIncomeDto,
  ): Promise<{ message: string; recurringIncome: RecurringIncome }> {
    const response = await api.post('/recurring-incomes', data);
    return response.data;
  },

  async getAll(
    boardId: string,
  ): Promise<{ recurringIncomes: RecurringIncome[] }> {
    const params = new URLSearchParams({ boardId });
    const response = await api.get(`/recurring-incomes?${params.toString()}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateRecurringIncomeDto,
  ): Promise<{ message: string; recurringIncome: RecurringIncome }> {
    const response = await api.patch(`/recurring-incomes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/recurring-incomes/${id}`);
  },
};
