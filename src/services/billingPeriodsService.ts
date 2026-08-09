import api from './api';
import {
  BillingPeriod,
  BillingPeriodDefaults,
  ConfirmBillingPeriodDto,
} from '@/types/billing-period';

export const billingPeriodsService = {
  async getPending(
    paymentMethodId: string,
    cycleLabel: string,
  ): Promise<{ pending: BillingPeriodDefaults }> {
    const response = await api.get('/billing-periods/pending', {
      params: { paymentMethodId, cycleLabel },
    });
    return response.data;
  },

  async listByPaymentMethod(
    paymentMethodId: string,
  ): Promise<{ periods: BillingPeriod[] }> {
    const response = await api.get('/billing-periods', {
      params: { paymentMethodId },
    });
    return response.data;
  },

  async getNext(
    paymentMethodId: string,
  ): Promise<{ pending: BillingPeriodDefaults }> {
    const response = await api.get('/billing-periods/next', {
      params: { paymentMethodId },
    });
    return response.data;
  },

  async confirm(
    data: ConfirmBillingPeriodDto,
  ): Promise<{ period: BillingPeriod }> {
    const response = await api.post('/billing-periods/confirm', data);
    return response.data;
  },
};
