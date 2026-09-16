import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GoalsPage from './GoalsPage';
import { goalsService } from '@/services/goalsService';
import { wealthService } from '@/services/wealthService';
import type { GoalWithResult, PlannerGoalResult } from '@/types/goals';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

vi.mock('@/store/boardsStore', () => ({
  useBoardsStore: (selector: (state: unknown) => unknown) =>
    selector({
      boards: [
        {
          _id: 'board-1',
          name: 'Casa',
          baseCurrency: 'ARS',
          type: 'everyday',
          isShared: true,
          createdAt: '2026-01-01',
        },
      ],
    }),
}));

vi.mock('@/services/goalsService', () => ({
  goalsService: {
    list: vi.fn(),
    getProgress: vi.fn(),
    preview: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateHoldings: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/services/wealthService', () => ({
  wealthService: { getOverview: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedGoals = vi.mocked(goalsService);
const mockedWealth = vi.mocked(wealthService);

function planner(
  overrides: Partial<PlannerGoalResult> = {},
): PlannerGoalResult {
  return {
    goalId: 'goal-1',
    status: 'active',
    currentComputableValueIndividual: 400_000,
    currentComputableValueJoint: 250_000,
    remainingAmountIndividual: 600_000,
    remainingAmountJoint: 750_000,
    monthsAvailable: 12,
    withinHorizon: true,
    requiredMonthlyContributionIndividual: 50_000,
    requiredMonthlyContributionJoint: 62_500,
    forecastCapacityComputable: true,
    averageMonthlyCapacity: 80_000,
    viableIndividual: true,
    viableJoint: false,
    estimatedCompletionYearMonthIndividual: '2027-06',
    estimatedCompletionYearMonthJoint: '2027-10',
    tightestYearMonthIndividual: '2027-06',
    tightestYearMonthJoint: '2027-10',
    deficitIndividual: 0,
    deficitJoint: 100_000,
    negativeCapacityYearMonths: [],
    holdingContributions: [
      {
        holdingId: 'holding-1',
        currency: 'ARS',
        fullValue: 400_000,
        computable: true,
        isEstimated: false,
        valueInGoalCurrencyIndividual: 400_000,
        valueInGoalCurrencyJoint: 250_000,
        sharedWithGoalIds: ['goal-2'],
      },
    ],
    paceStatusIndividual: 'on_track',
    paceStatusJoint: 'behind',
    ...overrides,
  };
}

function goalItem(): GoalWithResult {
  return {
    goal: {
      _id: 'goal-1',
      boardId: 'board-1',
      createdBy: 'user-1',
      name: 'Fondo de emergencia',
      icon: '🛟',
      targetAmount: 1_000_000,
      currency: 'ARS',
      targetDate: '2027-09-01T00:00:00.000Z',
      priority: 1,
      status: 'active',
      useEstimatedFxForForecast: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    selections: [
      {
        _id: 'selection-1',
        goalId: 'goal-1',
        holdingId: 'holding-1',
        useEstimatedFx: false,
      },
    ],
    result: planner(),
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GoalsPage />
    </QueryClientProvider>,
  );
}

describe('GoalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedWealth.getOverview.mockResolvedValue({
      holdings: [
        {
          _id: 'holding-1',
          name: 'Caja de ahorro',
          type: 'bank_account',
          currency: 'ARS',
          currentBalance: 400_000,
          allocatedBalance: 0,
          availableBalance: 400_000,
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      totalsByCurrency: {},
      recentEvents: [],
      investmentPositions: [],
      investmentTransactions: [],
    });
    mockedGoals.getProgress.mockResolvedValue({
      hasEnoughData: false,
      message:
        'Todavía no tenemos suficientes mediciones para evaluar el avance mensual.',
    });
  });

  it('muestra el estado vacío', async () => {
    mockedGoals.list.mockResolvedValue({
      goals: [],
      summary: { total: 0, achievable: 0, atRisk: 0, insufficientData: 0 },
    });

    renderPage();

    expect(
      await screen.findByText('Todavía no tenés objetivos'),
    ).toBeInTheDocument();
  });

  it('mantiene separada la viabilidad individual de la conjunta', async () => {
    mockedGoals.list.mockResolvedValue({
      goals: [goalItem()],
      summary: { total: 1, achievable: 0, atRisk: 1, insufficientData: 0 },
    });

    renderPage();

    expect(
      await screen.findByText('Individual: Alcanzable'),
    ).toBeInTheDocument();
    expect(screen.getByText('Conjunta: En riesgo')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Todavía no tenemos suficientes mediciones para evaluar el avance mensual.',
      ),
    ).toBeInTheDocument();

    // 400.000 / 1.000.000 individual, 250.000 / 1.000.000 conjunto — nunca
    // un único porcentaje que mezcle ambos.
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('permite seleccionar tenencias en el formulario', async () => {
    mockedGoals.list.mockResolvedValue({
      goals: [],
      summary: { total: 0, achievable: 0, atRisk: 0, insufficientData: 0 },
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Nuevo objetivo' }),
    );
    expect(
      screen.getByRole('button', { name: 'Usar ícono 🎯' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.queryByRole('button', { name: /predeterminado/i }),
    ).not.toBeInTheDocument();
    const homeIcon = screen.getByRole('button', { name: 'Usar ícono 🏠' });
    await user.click(homeIcon);
    const holding = await screen.findByRole('checkbox', {
      name: 'Incluir Caja de ahorro',
    });
    await user.click(holding);

    expect(homeIcon).toHaveAttribute('aria-pressed', 'true');
    expect(holding).toBeChecked();
    expect(
      screen.getByText('Seleccionarlas no reserva ni bloquea su saldo.'),
    ).toBeInTheDocument();
  });

  it('exige ver el preview antes de guardar', async () => {
    mockedGoals.list.mockResolvedValue({
      goals: [],
      summary: { total: 0, achievable: 0, atRisk: 0, insufficientData: 0 },
    });
    mockedGoals.preview.mockResolvedValue({
      candidate: planner(),
      affectedGoals: [],
    });
    mockedGoals.create.mockResolvedValue(goalItem());
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Nuevo objetivo' }),
    );
    await user.type(
      screen.getByPlaceholderText('Ej: Fondo de emergencia'),
      'Casa propia',
    );
    await user.type(
      screen.getByRole('textbox', { name: /monto objetivo/i }),
      '1000000',
    );
    await user.type(screen.getByLabelText('Fecha objetivo'), '2027-09-01');
    await user.click(screen.getByRole('button', { name: 'Ver estimación' }));

    expect(await screen.findByText('Revisá la estimación')).toBeInTheDocument();
    expect(screen.getByText('Ahorro mensual posible')).toBeInTheDocument();
    expect(screen.getByText('+ $ 17.500,00 de margen')).toBeInTheDocument();
    expect(mockedGoals.preview).toHaveBeenCalledTimes(1);
    expect(mockedGoals.create).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Confirmar y guardar' }),
    );
    await waitFor(() => expect(mockedGoals.create).toHaveBeenCalledTimes(1));
  });
});
