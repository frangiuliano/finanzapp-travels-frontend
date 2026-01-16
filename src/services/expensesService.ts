import api from './api';
import type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseStatus,
  TripExpenseSummary,
  ParticipantBalance,
  ParticipantDebtsResponse,
} from '@/types/expense';

export const expensesService = {
  async createExpense(
    data: CreateExpenseDto,
  ): Promise<{ message: string; expense: Expense }> {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async getExpenses(
    tripId: string,
    budgetId?: string,
    status?: ExpenseStatus,
  ): Promise<{ expenses: Expense[] }> {
    const params = new URLSearchParams({ tripId });
    if (budgetId) params.append('budgetId', budgetId);
    if (status) params.append('status', status);

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  async getExpenseById(id: string): Promise<{ expense: Expense }> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async updateExpense(
    id: string,
    data: UpdateExpenseDto,
  ): Promise<{ message: string; expense: Expense }> {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async getTripExpenseSummary(
    tripId: string,
  ): Promise<{ summary: TripExpenseSummary }> {
    const response = await api.get(`/expenses/trip/${tripId}/summary`);
    return response.data;
  },

  async getParticipantBalance(
    participantId: string,
    tripId: string,
  ): Promise<{ balance: ParticipantBalance }> {
    const response = await api.get(
      `/expenses/participant/${participantId}/balance?tripId=${tripId}`,
    );
    return response.data;
  },

  async settleExpense(id: string): Promise<{
    message: string;
    expense: Expense;
  }> {
    const response = await api.post(`/expenses/${id}/settle`);
    return response.data;
  },

  async getParticipantDebts(tripId: string): Promise<ParticipantDebtsResponse> {
    const response = await api.get(`/expenses/trip/${tripId}/debts`);
    return response.data;
  },
};
