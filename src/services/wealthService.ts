import api from './api';
import type {
  FinancialInstrument,
  GoalStatus,
  HoldingType,
  InstrumentType,
  WealthOverview,
} from '@/types/wealth';

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
  async getInstruments(search = ''): Promise<FinancialInstrument[]> {
    const response = await api.get('/wealth/instruments/catalog', {
      params: { search },
    });
    return response.data.instruments;
  },
  async createInstrument(data: {
    symbol: string;
    name: string;
    type: InstrumentType;
    currency: string;
    exchange?: string;
  }): Promise<FinancialInstrument> {
    return (await api.post('/wealth/instruments/catalog', data)).data;
  },
  async createPosition(
    holdingId: string,
    data: {
      instrumentId: string;
      quantity: number;
      averageCost: number;
      currentPrice: number;
    },
  ) {
    return (await api.post(`/wealth/investments/${holdingId}/positions`, data))
      .data;
  },
  async updatePositionPrice(positionId: string, currentPrice: number) {
    return (
      await api.patch(`/wealth/investments/positions/${positionId}/price`, {
        currentPrice,
      })
    ).data;
  },
  async trade(
    holdingId: string,
    data: {
      instrumentId: string;
      type: 'buy' | 'sell';
      quantity: number;
      unitPrice: number;
      fees?: number;
    },
  ) {
    return (
      await api.post(`/wealth/investments/${holdingId}/transactions`, data)
    ).data;
  },
};
