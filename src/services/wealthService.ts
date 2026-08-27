import api from './api';
import type { GoalStatus, HoldingType, WealthOverview } from '@/types/wealth';

export const wealthService = {
  async getOverview(): Promise<WealthOverview> {
    const response = await api.get('/wealth');
    return response.data;
  },
  async createHolding(data: {
    name: string;
    type: HoldingType;
    institution?: string;
    currency: string;
    currentBalance: number;
  }) {
    return (await api.post('/wealth/holdings', data)).data;
  },
  async updateHolding(
    id: string,
    data: { name?: string; type?: HoldingType; institution?: string },
  ) {
    return (await api.patch(`/wealth/holdings/${id}`, data)).data;
  },
  async adjustBalance(id: string, data: { balance: number; note?: string }) {
    return (await api.post(`/wealth/holdings/${id}/balance-adjustments`, data))
      .data;
  },
  async archiveHolding(id: string) {
    await api.delete(`/wealth/holdings/${id}`);
  },
  async createGoal(data: {
    name: string;
    targetAmount: number;
    currency: string;
    targetDate?: string;
    plannedMonthlyContribution?: number;
    priority?: number;
    icon?: string;
  }) {
    return (await api.post('/wealth/goals', data)).data;
  },
  async updateGoal(
    id: string,
    data: {
      name?: string;
      targetAmount?: number;
      targetDate?: string;
      plannedMonthlyContribution?: number;
      priority?: number;
      icon?: string;
      status?: GoalStatus;
    },
  ) {
    return (await api.patch(`/wealth/goals/${id}`, data)).data;
  },
  async archiveGoal(id: string) {
    await api.delete(`/wealth/goals/${id}`);
  },
  async contribute(
    goalId: string,
    data: {
      holdingId: string;
      kind: 'contribution' | 'withdrawal';
      amount: number;
      note?: string;
    },
  ): Promise<WealthOverview> {
    return (await api.post(`/wealth/goals/${goalId}/contributions`, data)).data;
  },
};
