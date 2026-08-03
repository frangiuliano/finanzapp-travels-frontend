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

export interface ExpenseListFilters {
  budgetId?: string;
  status?: ExpenseStatus;
  categoryId?: string;
  paymentMethodId?: string;
  from?: string;
  to?: string;
}

export const expensesService = {
  async createExpense(
    data: CreateExpenseDto,
    clientRequestId?: string,
  ): Promise<{ message: string; expense: Expense }> {
    const idempotencyKey = clientRequestId ?? data.clientRequestId;
    const response = await api.post('/expenses', data, {
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    });
    return response.data;
  },

  async getExpenses(
    tripId: string,
    budgetId?: string,
    status?: ExpenseStatus,
    filters: ExpenseListFilters = {},
  ): Promise<{ expenses: Expense[] }> {
    return this.listExpenses(tripId, {
      ...filters,
      budgetId: filters.budgetId ?? budgetId,
      status: filters.status ?? status,
    });
  },

  async listExpenses(
    boardId: string,
    filters: ExpenseListFilters = {},
  ): Promise<{ expenses: Expense[] }> {
    const params = new URLSearchParams({ tripId: boardId, boardId });
    if (filters.budgetId) params.set('budgetId', filters.budgetId);
    if (filters.status) params.set('status', filters.status);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.paymentMethodId) {
      params.set('paymentMethodId', filters.paymentMethodId);
    }
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

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

  async skipRecurringExpense(id: string): Promise<{ message: string }> {
    const response = await api.post(`/expenses/${id}/skip`);
    return response.data;
  },

  async getParticipantDebts(tripId: string): Promise<ParticipantDebtsResponse> {
    const response = await api.get(`/expenses/trip/${tripId}/debts`);
    return response.data;
  },
};
