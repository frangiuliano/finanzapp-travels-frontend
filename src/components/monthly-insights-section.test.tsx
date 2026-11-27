import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MonthlyInsightsSection } from './monthly-insights-section';
import { insightsService } from '@/services/insightsService';
import type { MonthlyInsightsResponse } from '@/types/insight';

vi.mock('@/services/insightsService', () => ({
  insightsService: {
    getMonthlyInsights: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function response(
  overrides: Partial<MonthlyInsightsResponse> = {},
): MonthlyInsightsResponse {
  return {
    boardId: 'board-1',
    currency: 'ARS',
    currentPeriod: '2026-09',
    previousPeriod: '2026-08',
    monthStatus: 'complete_past',
    comparisonMode: 'full_month',
    insights: [],
    ...overrides,
  };
}

const mockedGetMonthlyInsights = vi.mocked(insightsService.getMonthlyInsights);

describe('MonthlyInsightsSection', () => {
  beforeEach(() => {
    mockedGetMonthlyInsights.mockReset();
  });

  it('renders nothing for a mock board id (no API call)', () => {
    renderWithClient(
      <MonthlyInsightsSection boardId="mock-board" yearMonth="2026-09" />,
    );

    expect(mockedGetMonthlyInsights).not.toHaveBeenCalled();
  });

  it('shows loading skeletons while the request is pending', () => {
    mockedGetMonthlyInsights.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithClient(
      <MonthlyInsightsSection boardId="board-1" yearMonth="2026-09" />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  it('shows an error message when the request fails', async () => {
    mockedGetMonthlyInsights.mockRejectedValue(new Error('network error'));

    renderWithClient(
      <MonthlyInsightsSection boardId="board-1" yearMonth="2026-09" />,
    );

    expect(
      await screen.findByText(
        'No se pudieron cargar los insights de este mes.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the insufficient_data state distinctly from a normal insight list', async () => {
    mockedGetMonthlyInsights.mockResolvedValue({
      insights: response({
        insights: [
          {
            id: 'insufficient_data:board-1:2026-09:status',
            type: 'insufficient_data',
            severity: 'neutral',
            title: 'Sin datos para comparar',
            description:
              'Todavía no hay suficientes datos para comparar este período.',
            categoryId: null,
            categoryName: null,
            installmentPlanId: null,
            installmentPlanLabel: null,
            currency: 'ARS',
            currentAmount: null,
            previousAmount: null,
            absoluteChange: null,
            percentChange: null,
            currentPeriod: '2026-09',
            previousPeriod: '2026-08',
          },
        ],
      }),
    });

    renderWithClient(
      <MonthlyInsightsSection boardId="board-1" yearMonth="2026-09" />,
    );

    expect(
      await screen.findByText(
        'Todavía no hay suficientes datos para comparar este período.',
      ),
    ).toBeInTheDocument();
  });

  it('renders multiple insights (e.g. total_variation + category_new) as separate rows', async () => {
    mockedGetMonthlyInsights.mockResolvedValue({
      insights: response({
        insights: [
          {
            id: 'total_variation:board-1:2026-09:total',
            type: 'total_variation',
            severity: 'negative',
            title: 'Tus gastos totales subieron',
            description:
              'Gastaste un 18% más que en agosto: $24.000 adicionales.',
            categoryId: null,
            categoryName: null,
            installmentPlanId: null,
            installmentPlanLabel: null,
            currency: 'ARS',
            currentAmount: 118,
            previousAmount: 100,
            absoluteChange: 18,
            percentChange: 18,
            currentPeriod: '2026-09',
            previousPeriod: '2026-08',
          },
          {
            id: 'category_new:board-1:2026-09:cat-health',
            type: 'category_new',
            severity: 'neutral',
            title: 'Nueva categoría este mes',
            description: 'Este mes comenzaste a registrar gastos en Salud.',
            categoryId: 'cat-health',
            categoryName: 'Salud',
            installmentPlanId: null,
            installmentPlanLabel: null,
            currency: 'ARS',
            currentAmount: 5000,
            previousAmount: 0,
            absoluteChange: 5000,
            percentChange: null,
            currentPeriod: '2026-09',
            previousPeriod: '2026-08',
          },
        ],
      }),
    });

    renderWithClient(
      <MonthlyInsightsSection boardId="board-1" yearMonth="2026-09" />,
    );

    expect(
      await screen.findByText('Tus gastos totales subieron'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Este mes comenzaste a registrar gastos en Salud.'),
    ).toBeInTheDocument();
  });

  it('shows the section heading "Así viene tu mes"', async () => {
    mockedGetMonthlyInsights.mockResolvedValue({ insights: response() });

    renderWithClient(
      <MonthlyInsightsSection boardId="board-1" yearMonth="2026-09" />,
    );

    expect(screen.getByText('Así viene tu mes')).toBeInTheDocument();
    await waitFor(() => expect(mockedGetMonthlyInsights).toHaveBeenCalled());
  });
});
