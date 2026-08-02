export interface SimulatedExpenseMonth {
  yearMonth: string;
  installmentNumber: number;
  simulatedExpense: number;
  baselineRemaining: number;
  projectedRemaining: number;
  isFutureMonth: boolean;
}

export interface ExpenseSimulationResult {
  label: string;
  totalAmount: number;
  installments: number;
  startYearMonth: string;
  currency: string;
  months: SimulatedExpenseMonth[];
  summary: {
    tightestYearMonth: string;
    lowestProjectedRemaining: number;
    goesNegative: boolean;
  };
}

export interface SimulateExpenseInput {
  boardId: string;
  label: string;
  totalAmount: number;
  installments?: number;
  startYearMonth?: string;
}
