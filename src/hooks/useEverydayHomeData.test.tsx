import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEverydayHomeData } from './useEverydayHomeData';
import { forecastService } from '@/services/forecastService';
import { insightsService } from '@/services/insightsService';
import { goalsService } from '@/services/goalsService';
import { boardMonthBudgetsService } from '@/services/boardMonthBudgetsService';
import { incomesService } from '@/services/incomesService';
import { expensesService } from '@/services/expensesService';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/services/forecastService', () => ({
  forecastService: { getMonthlyForecast: vi.fn() },
}));
vi.mock('@/services/insightsService', () => ({
  insightsService: { getMonthlyInsights: vi.fn() },
}));
vi.mock('@/services/goalsService', () => ({
  goalsService: { getPrioritySummary: vi.fn() },
}));
vi.mock('@/services/boardMonthBudgetsService', () => ({
  boardMonthBudgetsService: { getProgress: vi.fn() },
}));
vi.mock('@/services/incomesService', () => ({
  incomesService: { getRecent: vi.fn() },
}));
vi.mock('@/services/expensesService', () => ({
  expensesService: { getRecent: vi.fn() },
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('Home independent queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: 'user-1' } as never });
    vi.mocked(forecastService.getMonthlyForecast).mockResolvedValue({
      forecast: { yearMonth: '2026-10' },
    } as never);
    vi.mocked(insightsService.getMonthlyInsights).mockResolvedValue({
      insights: { insights: [] },
    } as never);
    vi.mocked(goalsService.getPrioritySummary).mockResolvedValue({
      goal: null,
    } as never);
    vi.mocked(boardMonthBudgetsService.getProgress).mockResolvedValue({
      progress: [],
    });
    vi.mocked(incomesService.getRecent).mockResolvedValue({ incomes: [] });
    vi.mocked(expensesService.getRecent).mockResolvedValue({ expenses: [] });
  });

  it('makes movements available while forecast and insights are still loading', async () => {
    vi.mocked(forecastService.getMonthlyForecast).mockReturnValue(
      new Promise(() => {}),
    );
    vi.mocked(insightsService.getMonthlyInsights).mockReturnValue(
      new Promise(() => {}),
    );
    const { wrapper, client } = setup();
    const { result, unmount } = renderHook(
      () => useEverydayHomeData('board-1', '2026-10', 0, 0),
      { wrapper },
    );
    await waitFor(() =>
      expect(
        result.current.expenses.isSuccess && result.current.incomes.isSuccess,
      ).toBe(true),
    );
    expect(result.current.forecast.isPending).toBe(true);
    expect(result.current.insights.isPending).toBe(true);
    unmount();
    client.clear();
  });

  it('reuses fresh cache on navigation and refreshes the goal after an expense mutation', async () => {
    const { wrapper, client } = setup();
    const first = renderHook(
      () => useEverydayHomeData('board-1', '2026-10', 0, 0),
      { wrapper },
    );
    await waitFor(() =>
      expect(first.result.current.forecast.isSuccess).toBe(true),
    );
    first.unmount();
    const second = renderHook(
      ({ refresh }) => useEverydayHomeData('board-1', '2026-10', refresh, 0),
      { wrapper, initialProps: { refresh: 0 } },
    );
    expect(forecastService.getMonthlyForecast).toHaveBeenCalledTimes(1);
    second.rerender({ refresh: 1 });
    await waitFor(() =>
      expect(goalsService.getPrioritySummary).toHaveBeenCalledTimes(2),
    );
    second.unmount();
    client.clear();
  });

  it('keeps cache isolated by month and authenticated user', async () => {
    const { wrapper, client } = setup();
    const view = renderHook(
      ({ month }) => useEverydayHomeData('board-1', month, 0, 0),
      { wrapper, initialProps: { month: '2026-10' } },
    );
    await waitFor(() =>
      expect(view.result.current.forecast.isSuccess).toBe(true),
    );
    view.rerender({ month: '2026-11' });
    await waitFor(() =>
      expect(forecastService.getMonthlyForecast).toHaveBeenCalledTimes(2),
    );
    act(() => useAuthStore.setState({ user: { id: 'user-2' } as never }));
    await waitFor(() =>
      expect(forecastService.getMonthlyForecast).toHaveBeenCalledTimes(3),
    );
    view.unmount();
    client.clear();
  });
});
