import { formatCurrency } from '@/lib/utils';
import type { ExpenseDisplayFx, ExpenseFxPurpose } from '@/types/expense';

export interface ExpenseCurrencyFields {
  amount: number;
  currency: string;
  fxRateToBoardCurrency?: number | null;
  displayFx?: ExpenseDisplayFx;
}

export function getExpenseAmountInBoardCurrency(
  expense: ExpenseCurrencyFields,
  boardCurrency: string,
): number | null {
  if (expense.displayFx) {
    return expense.displayFx.amountInBoardCurrency;
  }

  if (expense.currency === boardCurrency) {
    return expense.amount;
  }

  if (
    expense.fxRateToBoardCurrency != null &&
    expense.fxRateToBoardCurrency > 0
  ) {
    return expense.amount * expense.fxRateToBoardCurrency;
  }

  return null;
}

export function getFxPurposeLabel(
  purpose?: ExpenseFxPurpose,
  isLive?: boolean,
): string | null {
  if (purpose === 'referential') {
    return isLive ? 'Referencial (TC actual)' : 'Referencial';
  }
  if (purpose === 'settled') {
    return 'Confirmado';
  }
  return null;
}

export function formatDualCurrencyAmount(
  expense: ExpenseCurrencyFields,
  boardCurrency: string,
): {
  primary: string;
  secondary: string | null;
  fxLabel: string | null;
} {
  const primary = formatCurrency(expense.amount, expense.currency);
  const converted = getExpenseAmountInBoardCurrency(expense, boardCurrency);
  const fxLabel = expense.displayFx
    ? getFxPurposeLabel(expense.displayFx.purpose, expense.displayFx.isLive)
    : null;

  if (expense.currency === boardCurrency || converted == null) {
    return { primary, secondary: null, fxLabel };
  }

  return {
    primary,
    secondary: `≈ ${formatCurrency(converted, boardCurrency)}`,
    fxLabel,
  };
}
