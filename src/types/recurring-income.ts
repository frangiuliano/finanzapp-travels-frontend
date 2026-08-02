export interface RecurringIncome {
  _id: string;
  label: string;
  amount: number;
  currency: string;
  description?: string;
  daysOfMonth: number[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateRecurringIncomeDto {
  boardId: string;
  label: string;
  amount: number;
  currency?: string;
  description?: string;
  daysOfMonth: number[];
}

export interface UpdateRecurringIncomeDto {
  label?: string;
  amount?: number;
  currency?: string;
  description?: string;
  daysOfMonth?: number[];
  isActive?: boolean;
  amountChangeScope?: 'this_month' | 'from_month';
  amountChangeYearMonth?: string;
  cancelFromYearMonth?: string;
}
