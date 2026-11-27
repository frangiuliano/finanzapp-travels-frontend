import type { CurrencyBreakdownEntry } from '@/types/currency-breakdown';

export interface ForecastLineItem {
  id: string;
  label: string;
  amount: number;
  currency: string;
  dayOfMonth: number;
  kind: 'recurring-income' | 'recurring-expense' | 'installment';
  status?: 'pending' | 'confirmed' | 'paid';
  meta?: {
    installmentNumber?: number;
    totalInstallments?: number;
    daysOfMonth?: number[];
    paymentMethodId?: string;
  };
}

export interface MonthlyForecast {
  boardId: string;
  yearMonth: string;
  currency: string;
  isFutureMonth: boolean;
  actual: {
    totalIncomes: number;
    totalExpenses: number;
    remaining: number;
    incomesByCurrency: CurrencyBreakdownEntry[];
    expensesByCurrency: CurrencyBreakdownEntry[];
  };
  planned: {
    incomes: ForecastLineItem[];
    fixedExpenses: ForecastLineItem[];
    installments: ForecastLineItem[];
    totalIncomes: number;
    totalOutflows: number;
    projectedRemaining: number;
    incomesByCurrency: CurrencyBreakdownEntry[];
    outflowsByCurrency: CurrencyBreakdownEntry[];
  };
}
