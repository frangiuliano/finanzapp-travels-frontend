import api from './api';
import type { BoardMonthBudgetProgress } from '@/types/board-month-budget';

export const boardMonthBudgetsService = {
  async getProgress(
    boardId: string,
    yearMonth: string,
  ): Promise<{ progress: BoardMonthBudgetProgress[] }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(
      `/board-month-budgets/progress?${params.toString()}`,
    );
    return response.data;
  },
};
