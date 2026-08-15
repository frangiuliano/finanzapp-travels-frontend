import api from './api';
import {
  CreatePaymentMethodDto,
  PaymentMethod,
  PaymentMethodOwnerType,
  PaymentMethodVisibility,
  UpdatePaymentMethodDto,
} from '@/types/payment-method';

export const paymentMethodsService = {
  async getAvailableForBoard(
    boardId: string,
  ): Promise<{ paymentMethods: PaymentMethod[] }> {
    const response = await api.get(
      `/payment-methods?boardId=${encodeURIComponent(boardId)}`,
    );
    return response.data;
  },

  async getByScope(
    boardId: string,
    scope: PaymentMethodOwnerType,
    includeInactive = false,
  ): Promise<{ paymentMethods: PaymentMethod[] }> {
    const params = new URLSearchParams({
      boardId,
      scope,
    });
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }
    const response = await api.get(`/payment-methods?${params.toString()}`);
    return response.data;
  },

  async getBoardParticipantMethods(
    boardId: string,
  ): Promise<{ paymentMethods: PaymentMethod[] }> {
    const params = new URLSearchParams({
      scope: 'board-participants',
      boardId,
    });
    const response = await api.get(`/payment-methods?${params.toString()}`);
    return response.data;
  },

  async getUserMethods(
    includeInactive = false,
  ): Promise<{ paymentMethods: PaymentMethod[] }> {
    const params = new URLSearchParams({ scope: 'user' });
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }
    const response = await api.get(`/payment-methods?${params.toString()}`);
    return response.data;
  },

  async setBoardVisibility(
    paymentMethodId: string,
    boardId: string,
    enabled: boolean,
  ): Promise<{ message: string; visibility: PaymentMethodVisibility }> {
    const response = await api.patch(
      `/payment-methods/${encodeURIComponent(paymentMethodId)}/boards/${encodeURIComponent(boardId)}/visibility`,
      { enabled },
    );
    return response.data;
  },

  async getById(id: string): Promise<{ paymentMethod: PaymentMethod }> {
    const response = await api.get(`/payment-methods/${id}`);
    return response.data;
  },

  async create(data: CreatePaymentMethodDto): Promise<{
    message: string;
    paymentMethod: PaymentMethod;
  }> {
    const response = await api.post('/payment-methods', data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdatePaymentMethodDto,
  ): Promise<{ message: string; paymentMethod: PaymentMethod }> {
    const response = await api.patch(`/payment-methods/${id}`, data);
    return response.data;
  },

  async archive(id: string): Promise<{
    message: string;
    paymentMethod: PaymentMethod;
  }> {
    const response = await api.delete(`/payment-methods/${id}`);
    return response.data;
  },
};
