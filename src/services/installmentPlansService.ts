import api from './api';
import type {
  CreateInstallmentPlanDto,
  InstallmentPlan,
  UpdateInstallmentPlanDto,
} from '@/types/installment-plan';

export const installmentPlansService = {
  async create(
    data: CreateInstallmentPlanDto,
  ): Promise<{ message: string; installmentPlan: InstallmentPlan }> {
    const response = await api.post('/installment-plans', data);
    return response.data;
  },

  async getAll(
    boardId: string,
  ): Promise<{ installmentPlans: InstallmentPlan[] }> {
    const params = new URLSearchParams({ boardId });
    const response = await api.get(`/installment-plans?${params.toString()}`);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateInstallmentPlanDto,
  ): Promise<{ message: string; installmentPlan: InstallmentPlan }> {
    const response = await api.patch(`/installment-plans/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/installment-plans/${id}`);
  },
};
