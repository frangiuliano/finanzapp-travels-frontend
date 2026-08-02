export interface RecurringExpense {
  _id: string;
  label: string;
  amount: number;
  currency: string;
  description?: string;
  dayOfMonth: number;
  categoryId?: string;
  paymentMethodId?: string;
  isActive: boolean;
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
}

export interface UpdateRecurringExpenseDto {
  label?: string;
  amount?: number;
  currency?: string;
  description?: string;
  dayOfMonth?: number;
  categoryId?: string;
  paymentMethodId?: string;
  isActive?: boolean;
  amountChangeScope?: 'this_month' | 'from_month';
  amountChangeYearMonth?: string;
  cancelFromYearMonth?: string;
}
