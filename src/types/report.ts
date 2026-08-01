import type { PaymentMethodKind } from '@/types/payment-method';

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  total: number;
  count: number;
}

export interface PaymentMethodBreakdownItem {
  paymentMethodId: string | null;
  paymentMethodName: string;
  kind: PaymentMethodKind | null;
  total: number;
  count: number;
}

export interface BoardCalendarReport {
  boardId: string;
  yearMonth: string;
  currency: string;
  totalIncomes: number;
  totalExpenses: number;
  remaining: number;
  byCategory: CategoryBreakdownItem[];
  byPaymentMethod: PaymentMethodBreakdownItem[];
  excludedDueToCurrencyMismatch: {
    incomes: number;
    expenses: number;
  };
}

export interface CreditCycleReport {
  status: 'ok';
  boardId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  closingDay: number;
  cycleLabel: string;
  periodFrom: string;
  periodToInclusive: string;
  currency: string;
  totalExpenses: number;
  expenseCount: number;
  availableCycles: string[];
}

export interface CreditCycleClosingDayRequired {
  status: 'closing_day_required';
  boardId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  message: string;
}

export type CreditCycleReportResponse =
  | CreditCycleReport
  | CreditCycleClosingDayRequired;

export interface ConsolidatedBoardSummary {
  boardId: string;
  boardName: string;
  currency: string;
  totalIncomes: number;
  totalExpenses: number;
  remaining: number;
}

export interface CurrencyTotals {
  totalIncomes: number;
  totalExpenses: number;
  remaining: number;
  boardCount: number;
}

export interface ConsolidatedReport {
  yearMonth: string;
  boards: ConsolidatedBoardSummary[];
  totalsByCurrency: Record<string, CurrencyTotals>;
}
