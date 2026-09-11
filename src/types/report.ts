import type { PaymentMethodKind } from '@/types/payment-method';
import type { CurrencyBreakdownEntry } from '@/types/currency-breakdown';

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  total: number;
  count: number;
  otherCurrencyTotals: CurrencyBreakdownEntry[];
}

export interface PaymentMethodBreakdownItem {
  paymentMethodId: string | null;
  paymentMethodName: string;
  kind: PaymentMethodKind | null;
  total: number;
  count: number;
  otherCurrencyTotals: CurrencyBreakdownEntry[];
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
  incomesByCurrency: CurrencyBreakdownEntry[];
  expensesByCurrency: CurrencyBreakdownEntry[];
}

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
