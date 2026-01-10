import { SupportedCurrency } from '@/constants/currencies';

export interface Budget {
  _id: string;
  tripId: string;
  name: string;
  amount: number;
  currency: SupportedCurrency;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateBudgetDto {
  tripId: string;
  name: string;
  amount: number;
  currency?: SupportedCurrency;
}

export interface UpdateBudgetDto {
  name?: string;
  amount?: number;
  currency?: SupportedCurrency;
}
