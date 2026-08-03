export enum ExpenseStatus {
  PAID = 'paid',
  PENDING = 'pending',
}

export type ExpenseFxPolicy = 'spot' | 'credit_cycle';
export type ExpenseFxPurpose = 'referential' | 'settled';

export interface ExpenseDisplayFx {
  rate: number;
  amountInBoardCurrency: number;
  purpose: ExpenseFxPurpose;
  isLive: boolean;
  boardCurrency: string;
}

export enum SplitType {
  EQUAL = 'equal',
  MANUAL = 'manual',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

export interface ExpensePopulatedCategory {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface ExpenseSplit {
  participantId: string;
  participant?: {
    _id: string;
    userId?: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    guestName?: string;
    guestEmail?: string;
  };
  amount: number;
  percentage?: number;
}

export interface Expense {
  _id: string;
  tripId: string;
  boardId?: string;
  budgetId?: string;
  budget?: {
    _id: string;
    name: string;
  };
  amount: number;
  currency: string;
  fxRateToBoardCurrency?: number;
  fxCapturedAt?: string;
  fxPolicy?: ExpenseFxPolicy;
  fxPurpose?: ExpenseFxPurpose;
  billingCycleLabel?: string;
  displayFx?: ExpenseDisplayFx;
  description: string;
  merchantName?: string;
  tags?: string[];
  // The backend returns a populated category object when categoryId is set,
  // and a plain legacy free-text string otherwise.
  category?: string | ExpensePopulatedCategory;
  categoryId?: string;
  paidByParticipantId: string;
  paidByParticipant?: {
    _id: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    guestName?: string;
    guestEmail?: string;
  };
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  cardId?: string;
  paymentMethodId?: string;
  card?: {
    _id: string;
    name: string;
    lastFourDigits: string;
    type: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  isDivisible: boolean;
  splitType?: SplitType;
  splits?: ExpenseSplit[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  boardId?: string;
  tripId?: string;
  budgetId?: string;
  amount: number;
  currency?: string;
  fxRateOverride?: number;
  description: string;
  merchantName?: string;
  tags?: string[];
  category?: string;
  categoryId?: string;
  paidByParticipantId?: string;
  status?: ExpenseStatus;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  paymentMethodId?: string;
  isDivisible?: boolean;
  splitType?: SplitType;
  splits?: {
    participantId: string;
    amount: number;
    percentage?: number;
  }[];
  expenseDate?: string;
  clientRequestId?: string;
}

export const getExpenseCategoryLabel = (
  category: Expense['category'],
): string | undefined =>
  typeof category === 'string' ? category : category?.name;

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  status?: ExpenseStatus;
  amount?: number;
  splits?: {
    participantId: string;
    amount: number;
    percentage?: number;
  }[];
}

export interface TripExpenseSummary {
  totalExpenses: number;
  totalByBudget: Array<{
    budgetId: string;
    budgetName: string;
    total: number;
  }>;
  totalByStatus: {
    paid: number;
    pending: number;
  };
  totalByParticipant: Array<{
    participantId: string;
    participantName: string;
    totalPaid: number;
    totalOwed: number;
    balance: number;
  }>;
}

export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

export interface ParticipantDebt {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
}

export interface ParticipantDebtsResponse {
  debts: ParticipantDebt[];
}
