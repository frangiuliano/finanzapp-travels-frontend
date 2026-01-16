export enum ExpenseStatus {
  PAID = 'paid',
  PENDING = 'pending',
}

export enum SplitType {
  EQUAL = 'equal',
  MANUAL = 'manual',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
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
  budgetId?: string;
  budget?: {
    _id: string;
    name: string;
  };
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  tags?: string[];
  category?: string;
  paidByParticipantId?: string;
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
  paidByThirdParty?: {
    name: string;
    email?: string;
  };
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  cardId?: string;
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
  tripId: string;
  budgetId?: string;
  amount: number;
  currency?: string;
  description: string;
  merchantName?: string;
  tags?: string[];
  category?: string;
  paidByParticipantId?: string;
  paidByThirdParty?: {
    name: string;
    email?: string;
  };
  status?: ExpenseStatus;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  isDivisible?: boolean;
  splitType?: SplitType;
  splits?: {
    participantId: string;
    amount: number;
    percentage?: number;
  }[];
  expenseDate?: string;
}

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
