export interface BoardMonthBudgetProgress {
  budgetId: string;
  boardId: string;
  categoryId: string;
  yearMonth: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  currency: string;
}

export interface CreateBoardMonthBudgetDto {
  boardId?: string;
  tripId?: string;
  categoryId: string;
  yearMonth: string;
  limit: number;
}
