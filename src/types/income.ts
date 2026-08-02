import type { SupportedCurrency } from '@/constants/currencies';

export interface Income {
  _id: string;
  tripId: string;
  amount: number;
  currency: string;
  label: string;
  description?: string;
  incomeDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBoardSummary {
  boardId: string;
  yearMonth: string;
  currency: string;
  totalIncomes: number;
  totalExpenses: number;
  remaining: number;
  excludedDueToCurrencyMismatch: {
    incomes: number;
    expenses: number;
  };
}

export interface CreateIncomeDto {
  boardId?: string;
  tripId?: string;
  amount: number;
  currency?: SupportedCurrency;
  label: string;
  description?: string;
  incomeDate?: string;
}

export interface UpdateIncomeDto {
  amount?: number;
  currency?: SupportedCurrency;
  label?: string;
  description?: string;
  incomeDate?: string;
}
