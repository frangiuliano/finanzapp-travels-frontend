import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { forecastService } from '@/services/forecastService';
import { insightsService } from '@/services/insightsService';
import { goalsService } from '@/services/goalsService';
import { boardMonthBudgetsService } from '@/services/boardMonthBudgetsService';
import { incomesService } from '@/services/incomesService';
import { expensesService } from '@/services/expensesService';

export function useEverydayHomeData(
  boardId: string,
  yearMonth: string,
  refreshTrigger: number,
  incomesChangedRefresh: number,
) {
  const userId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const prefix = ['home', userId, boardId] as const;
  const enabled = !boardId.startsWith('mock-');
  const forecast = useQuery({
    queryKey: [...prefix, 'forecast', yearMonth],
    queryFn: () => forecastService.getMonthlyForecast(boardId, yearMonth),
    enabled,
  });
  const insights = useQuery({
    queryKey: [...prefix, 'insights', yearMonth],
    queryFn: () => insightsService.getMonthlyInsights(boardId, yearMonth),
    enabled,
  });
  const budgets = useQuery({
    queryKey: [...prefix, 'budgets', yearMonth],
    queryFn: () => boardMonthBudgetsService.getProgress(boardId, yearMonth),
    enabled,
  });
  const incomes = useQuery({
    queryKey: [...prefix, 'incomes', yearMonth],
    queryFn: () => incomesService.getRecent(boardId, yearMonth),
    enabled,
  });
  const expenses = useQuery({
    queryKey: [...prefix, 'expenses', yearMonth],
    queryFn: () => expensesService.getRecent(boardId, yearMonth),
    enabled,
  });
  const goal = useQuery({
    queryKey: [...prefix, 'goal', yearMonth],
    queryFn: () => goalsService.getPrioritySummary(boardId, yearMonth),
    enabled,
  });
  const previous = useRef({ refreshTrigger, incomesChangedRefresh });
  useEffect(() => {
    if (
      previous.current.refreshTrigger !== refreshTrigger ||
      previous.current.incomesChangedRefresh !== incomesChangedRefresh
    ) {
      void client.invalidateQueries({ queryKey: ['home', userId, boardId] });
    }
    previous.current = { refreshTrigger, incomesChangedRefresh };
  }, [client, userId, boardId, refreshTrigger, incomesChangedRefresh]);
  return { forecast, insights, budgets, incomes, expenses, goal };
}
