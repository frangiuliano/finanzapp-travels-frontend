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
  };
}

export type HomeMonthView = 'calendar' | 'cash_impact';

export interface MonthlyForecast {
  boardId: string;
  yearMonth: string;
  currency: string;
  attributionMode?: HomeMonthView;
  isFutureMonth: boolean;
  actual: {
    totalIncomes: number;
    totalExpenses: number;
    remaining: number;
  };
  planned: {
    incomes: ForecastLineItem[];
    fixedExpenses: ForecastLineItem[];
    installments: ForecastLineItem[];
    totalIncomes: number;
    totalOutflows: number;
    projectedRemaining: number;
  };
}
