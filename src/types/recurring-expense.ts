export type RecurringEscalationType = 'percent' | 'fixed';

export interface RecurringExpense {
  _id: string;
  label: string;
  amount: number;
  currency: string;
  description?: string;
  dayOfMonth: number;
  categoryId?: string;
  paymentMethodId?: string;
  excludedYearMonths: string[];
  isActive: boolean;
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
  createdAt: string;
}

export interface CreateRecurringExpenseDto {
  boardId: string;
  label: string;
  amount: number;
  currency?: string;
  description?: string;
  dayOfMonth: number;
  categoryId?: string;
  paymentMethodId?: string;
  excludedYearMonths?: string[];
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
}

export interface UpdateRecurringExpenseDto {
  label?: string;
  amount?: number;
  currency?: string;
  description?: string;
  dayOfMonth?: number;
  categoryId?: string;
  paymentMethodId?: string;
  excludedYearMonths?: string[];
  isActive?: boolean;
  amountChangeScope?: 'this_month' | 'from_month';
  amountChangeYearMonth?: string;
  cancelFromYearMonth?: string;
  escalationType?: RecurringEscalationType;
  escalationValue?: number;
  escalationFrequencyMonths?: number;
  disableEscalation?: boolean;
}
