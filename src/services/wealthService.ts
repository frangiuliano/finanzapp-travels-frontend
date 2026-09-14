import api from './api';
import type {
  FinancialInstrument,
  HoldingType,
  InstrumentType,
  WealthOverview,
} from '@/types/wealth';

export const wealthService = {
  async getOverview(boardId: string): Promise<WealthOverview> {
    const response = await api.get('/wealth', { params: { boardId } });
    return response.data;
  },
  async createHolding(
    boardId: string,
    data: {
      name: string;
      type: HoldingType;
      institution?: string;
      currency: string;
      currentBalance: number;
    },
  ) {
    return (await api.post('/wealth/holdings', data, { params: { boardId } }))
      .data;
  },
  async updateHolding(
    boardId: string,
    id: string,
    data: { name?: string; type?: HoldingType; institution?: string },
  ) {
    return (
      await api.patch(`/wealth/holdings/${id}`, data, { params: { boardId } })
    ).data;
  },
  async adjustBalance(
    boardId: string,
    id: string,
    data: { balance: number; note?: string },
  ) {
    return (
      await api.post(`/wealth/holdings/${id}/balance-adjustments`, data, {
        params: { boardId },
      })
    ).data;
  },
  async archiveHolding(boardId: string, id: string) {
    await api.delete(`/wealth/holdings/${id}`, { params: { boardId } });
  },
  async getInstruments(
    search = '',
    currency?: string,
  ): Promise<FinancialInstrument[]> {
    const response = await api.get('/wealth/instruments/catalog', {
      params: { search, currency },
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
    boardId: string,
    holdingId: string,
    data: {
      instrumentId: string;
      quantity: number;
      unitPrice: number;
    },
  ) {
    return (
      await api.post(`/wealth/investments/${holdingId}/positions`, data, {
        params: { boardId },
      })
    ).data;
  },
  async updatePositionPrice(
    boardId: string,
    positionId: string,
    currentPrice: number,
  ) {
    return (
      await api.patch(
        `/wealth/investments/positions/${positionId}/price`,
        {
          currentPrice,
        },
        { params: { boardId } },
      )
    ).data;
  },
  async refreshPositionPrice(boardId: string, positionId: string) {
    return (
      await api.post(
        `/wealth/investments/positions/${positionId}/refresh-price`,
        undefined,
        { params: { boardId } },
      )
    ).data as { currentPrice: number; capturedAt: string };
  },
  async trade(
    boardId: string,
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
      await api.post(`/wealth/investments/${holdingId}/transactions`, data, {
        params: { boardId },
      })
    ).data;
  },
  async updateTransaction(
    boardId: string,
    transactionId: string,
    data: {
      instrumentId: string;
      type: 'buy' | 'sell';
      quantity: number;
      unitPrice: number;
      fees?: number;
      note?: string;
    },
  ) {
    return (
      await api.patch(
        `/wealth/investments/transactions/${transactionId}`,
        data,
        { params: { boardId } },
      )
    ).data;
  },
  async deleteTransaction(boardId: string, transactionId: string) {
    await api.delete(`/wealth/investments/transactions/${transactionId}`, {
      params: { boardId },
    });
  },
};
