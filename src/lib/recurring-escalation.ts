import type { RecurringEscalationType } from '@/types/recurring-expense';

export interface RecurringEscalationFormState {
  enabled: boolean;
  type: RecurringEscalationType;
  value: string;
  frequencyMonths: string;
}

export const defaultRecurringEscalationState: RecurringEscalationFormState = {
  enabled: false,
  type: 'percent',
  value: '',
  frequencyMonths: '3',
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
  return {
    enabled: true,
    type: expense.escalationType,
    value: String(expense.escalationValue),
    frequencyMonths: String(expense.escalationFrequencyMonths),
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
  return null;
}

export function buildRecurringEscalationPayload(
  state: RecurringEscalationFormState,
): {
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
} {
  if (!state.enabled) {
    return {};
  }
  return {
    escalationType: state.type,
    escalationValue: Number(state.value.replace(',', '.')),
    escalationFrequencyMonths: Number(state.frequencyMonths),
  };
}
