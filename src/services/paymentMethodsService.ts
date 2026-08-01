import api from './api';
import {
  CreatePaymentMethodDto,
  PaymentMethod,
  PaymentMethodOwnerType,
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
