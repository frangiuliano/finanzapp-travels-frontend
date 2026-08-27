export type HoldingType =
  | 'bank_account'
  | 'virtual_wallet'
  | 'cash'
  | 'investment'
  | 'other';

export interface Holding {
  _id: string;
  name: string;
  type: HoldingType;
  institution?: string;
  currency: string;
  currentBalance: number;
  allocatedBalance: number;
  cashBalance?: number;
  availableBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type GoalPaceStatus = 'on_track' | 'behind' | 'no_plan' | 'completed';

export interface GoalAllocation {
  _id: string;
  goalId: string;
  holdingId: string;
  amount: number;
}

export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currency: string;
  targetDate?: string;
  plannedMonthlyContribution?: number;
  priority: number;
  icon?: string;
  status: GoalStatus;
  allocatedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  requiredMonthlyContribution: number | null;
  actualMonthlyContribution: number;
  estimatedCompletionDate: string | null;
  paceStatus: GoalPaceStatus;
  allocations: GoalAllocation[];
}

export interface WealthEvent {
  _id: string;
  holdingId: string;
  goalId?: string;
  kind:
    | 'initial_balance'
    | 'balance_adjustment'
    | 'contribution'
    | 'withdrawal';
  amount: number;
  balanceAfter?: number;
  allocationAfter?: number;
  note?: string;
  occurredAt: string;
}

export interface WealthOverview {
  holdings: Holding[];
  goals: SavingsGoal[];
  totalsByCurrency: Record<
    string,
    { balance: number; allocated: number; available: number }
  >;
  recentEvents: WealthEvent[];
  investmentPositions: InvestmentPosition[];
  investmentTransactions: InvestmentTransaction[];
}

export type InstrumentType =
  | 'stock'
  | 'etf'
  | 'cedear'
  | 'bond'
  | 'mutual_fund'
  | 'crypto'
  | 'other';

export interface FinancialInstrument {
  _id: string;
  symbol: string;
  name: string;
  type: InstrumentType;
  currency: string;
  exchange?: string;
}

export interface InvestmentPosition {
  _id: string;
  holdingId: string;
  instrumentId: FinancialInstrument;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  isOpen: boolean;
}

export interface InvestmentTransaction {
  _id: string;
  holdingId: string;
  instrumentId: string;
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  fees: number;
  occurredAt: string;
  note?: string;
}
