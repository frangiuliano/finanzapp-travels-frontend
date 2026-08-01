import api from './api';
import type {
  CreateRecurringExpenseDto,
  RecurringExpense,
  UpdateRecurringExpenseDto,
} from '@/types/recurring-expense';

export const recurringExpensesService = {
  async create(
    data: CreateRecurringExpenseDto,
  ): Promise<{ message: string; recurringExpense: RecurringExpense }> {
    const response = await api.post('/recurring-expenses', data);
    return response.data;
  },

  async getAll(
    boardId: string,
  ): Promise<{ recurringExpenses: RecurringExpense[] }> {
    const params = new URLSearchParams({ boardId });
    const response = await api.get(`/recurring-expenses?${params.toString()}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateRecurringExpenseDto,
  ): Promise<{ message: string; recurringExpense: RecurringExpense }> {
    const response = await api.patch(`/recurring-expenses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/recurring-expenses/${id}`);
  },
};
