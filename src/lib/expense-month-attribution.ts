import type { Expense } from '@/types/expense';
import type { PaymentMethod } from '@/types/payment-method';
import { getCurrentYearMonth } from '@/lib/utils';

export type HomeMonthView = 'calendar' | 'cash_impact';

export const HOME_MONTH_VIEW_STORAGE_KEY = 'finanzapp.homeMonthView';

export function readHomeMonthView(): HomeMonthView {
  if (typeof window === 'undefined') {
    return 'cash_impact';
  }

  const stored = window.localStorage.getItem(HOME_MONTH_VIEW_STORAGE_KEY);
  return stored === 'calendar' ? 'calendar' : 'cash_impact';
}

export function writeHomeMonthView(view: HomeMonthView) {
  window.localStorage.setItem(HOME_MONTH_VIEW_STORAGE_KEY, view);
}

function resolveCycleClosingMonth(
  expenseDate: Date,
  closingDay: number,
): string {
  const year = expenseDate.getUTCFullYear();
  const month = expenseDate.getUTCMonth() + 1;
  const day = expenseDate.getUTCDate();
  const padMonth = (value: number) => String(value).padStart(2, '0');

  if (day <= closingDay) {
    return `${year}-${padMonth(month)}`;
  }

  if (month === 12) {
    return `${year + 1}-01`;
  }

  return `${year}-${padMonth(month + 1)}`;
}

function getCalendarYearMonth(expenseDate: Date): string {
  const year = expenseDate.getUTCFullYear();
  const month = expenseDate.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function resolvePaymentMethod(
  expense: Expense,
  paymentMethodMap: Map<string, PaymentMethod>,
): PaymentMethod | undefined {
  const paymentMethodId = expense.paymentMethodId ?? expense.cardId;
  if (!paymentMethodId) {
    return undefined;
  }

  return paymentMethodMap.get(paymentMethodId);
}

export function getExpenseAttributionYearMonth(
  expense: Expense,
  mode: HomeMonthView,
  paymentMethodMap: Map<string, PaymentMethod>,
): string {
  const expenseDate = new Date(expense.expenseDate || expense.createdAt);
  const calendarMonth = getCalendarYearMonth(expenseDate);

  if (mode === 'calendar') {
    return calendarMonth;
  }

  const paymentMethod = resolvePaymentMethod(expense, paymentMethodMap);
  const isCreditWithClosing =
    paymentMethod?.kind === 'credit' && paymentMethod.closingDay != null;

  if (isCreditWithClosing) {
    return (
      expense.billingCycleLabel ??
      resolveCycleClosingMonth(expenseDate, paymentMethod.closingDay!)
    );
  }

  return calendarMonth;
}

export function expenseBelongsToYearMonth(
  expense: Expense,
  yearMonth: string,
  mode: HomeMonthView,
  paymentMethodMap: Map<string, PaymentMethod>,
): boolean {
  return (
    getExpenseAttributionYearMonth(expense, mode, paymentMethodMap) ===
    yearMonth
  );
}

export function getHomeMonthViewLabel(view: HomeMonthView): string {
  return view === 'cash_impact' ? 'Impacto en bolsillo' : 'Mes calendario';
}

export function getDefaultHomeYearMonth(): string {
  return getCurrentYearMonth();
}
