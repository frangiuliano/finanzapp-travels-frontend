import type { RecurringEscalationType } from '@/types/recurring-expense';
import {
  getCurrentYearMonth,
  monthsBetweenYearMonths,
  shiftYearMonth,
} from './utils';

export interface RecurringEscalationFormState {
  enabled: boolean;
  type: RecurringEscalationType;
  value: string;
  frequencyMonths: string;
  /** Month (YYYY-MM) of the first future increase. Used to compute the anchor the cycle counts from. */
  nextIncreaseYearMonth: string;
}

function defaultNextIncreaseYearMonth(frequencyMonths: string): string {
  const months = Number(frequencyMonths) || 3;
  return shiftYearMonth(getCurrentYearMonth(), months);
}

export const defaultRecurringEscalationState: RecurringEscalationFormState = {
  enabled: false,
  type: 'percent',
  value: '',
  frequencyMonths: '3',
  nextIncreaseYearMonth: defaultNextIncreaseYearMonth('3'),
};

export function recurringEscalationStateFromExpense(expense?: {
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
}): RecurringEscalationFormState {
  if (
    !expense?.escalationType ||
    !expense.escalationValue ||
    !expense.escalationFrequencyMonths
  ) {
    return defaultRecurringEscalationState;
  }
  const frequencyMonths = String(expense.escalationFrequencyMonths);
  return {
    enabled: true,
    type: expense.escalationType,
    value: String(expense.escalationValue),
    frequencyMonths,
    nextIncreaseYearMonth: defaultNextIncreaseYearMonth(frequencyMonths),
  };
}

export function validateRecurringEscalation(
  state: RecurringEscalationFormState,
): string | null {
  if (!state.enabled) return null;

  const value = Number(state.value.replace(',', '.'));
  const frequencyMonths = Number(state.frequencyMonths);

  if (!(value > 0)) {
    return state.type === 'percent'
      ? 'Ingresá un porcentaje de aumento válido'
      : 'Ingresá un monto de aumento válido';
  }
  if (state.type === 'percent' && value > 1000) {
    return 'El porcentaje de aumento debe ser menor o igual a 1000';
  }
  if (!Number.isInteger(frequencyMonths) || frequencyMonths < 1) {
    return 'Ingresá cada cuántos meses aumenta (mínimo 1)';
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(state.nextIncreaseYearMonth)) {
    return 'Elegí el mes del próximo aumento';
  }
  return null;
}

/** The month (YYYY-MM) the escalation cycle counts from, derived from `nextIncreaseYearMonth`. */
function anchorYearMonthFromState(state: RecurringEscalationFormState): string {
  return shiftYearMonth(
    state.nextIncreaseYearMonth,
    -Number(state.frequencyMonths),
  );
}

export function buildRecurringEscalationPayload(
  state: RecurringEscalationFormState,
  options: { includeAnchor?: boolean } = {},
): {
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
  anchorYearMonth?: string;
} {
  if (!state.enabled) {
    return {};
  }
  return {
    escalationType: state.type,
    escalationValue: Number(state.value.replace(',', '.')),
    escalationFrequencyMonths: Number(state.frequencyMonths),
    ...(options.includeAnchor
      ? { anchorYearMonth: anchorYearMonthFromState(state) }
      : {}),
  };
}

export interface RecurringEscalationPreviewEntry {
  yearMonth: string;
  amount: number;
  isIncrease: boolean;
}

/** Projects the amount for the next `monthsToShow` months so the user can see when increases actually land. */
export function buildRecurringEscalationPreview(
  baseAmount: number,
  state: RecurringEscalationFormState,
  monthsToShow = 6,
): RecurringEscalationPreviewEntry[] {
  if (!state.enabled || !(baseAmount > 0)) return [];

  const value = Number(state.value.replace(',', '.'));
  const frequencyMonths = Number(state.frequencyMonths);
  if (
    !(value > 0) ||
    !Number.isInteger(frequencyMonths) ||
    frequencyMonths < 1 ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(state.nextIncreaseYearMonth)
  ) {
    return [];
  }

  const anchorYearMonth = anchorYearMonthFromState(state);
  const startYearMonth = getCurrentYearMonth();

  const entries: RecurringEscalationPreviewEntry[] = [];
  let previousAmount: number | null = null;

  for (let i = 0; i < monthsToShow; i++) {
    const yearMonth = shiftYearMonth(startYearMonth, i);
    const monthsElapsed = monthsBetweenYearMonths(anchorYearMonth, yearMonth);
    const steps = Math.floor(monthsElapsed / frequencyMonths);
    const amount =
      steps <= 0
        ? baseAmount
        : state.type === 'percent'
          ? Math.round(baseAmount * Math.pow(1 + value / 100, steps) * 100) /
            100
          : Math.round((baseAmount + value * steps) * 100) / 100;

    entries.push({
      yearMonth,
      amount,
      isIncrease: previousAmount !== null && amount !== previousAmount,
    });
    previousAmount = amount;
  }

  return entries;
}
