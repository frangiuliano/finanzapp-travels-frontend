import api from './api';
import { Budget, CreateBudgetDto, UpdateBudgetDto } from '@/types/budget';

export const budgetsService = {
  async getAllBudgetsByTrip(tripId: string): Promise<{ budgets: Budget[] }> {
    const response = await api.get(`/budgets?tripId=${tripId}`);
    return response.data;
  },

  async getBudgetById(id: string): Promise<{ budget: Budget }> {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },

  async createBudget(data: CreateBudgetDto): Promise<{
    message: string;
    budget: Budget;
  }> {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  async updateBudget(
    id: string,
    data: UpdateBudgetDto,
  ): Promise<{ message: string; budget: Budget }> {
    const response = await api.patch(`/budgets/${id}`, data);
    return response.data;
  },

  async deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },
};
