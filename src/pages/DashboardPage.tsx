import { useEffect, useState } from 'react';
import { EXPENSES_CHANGED_EVENT } from '@/lib/expense-events';
import { EmptyBoardState } from '@/components/empty-board-state';
import { EverydayBoardHome } from '@/components/everyday-board-home';
import { TripDashboardCards } from '@/components/trip-dashboard-cards';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { StatisticsCards } from '@/components/statistics-cards';
import { BudgetsOverview } from '@/components/budgets-overview';
import { TripExpenseDistribution } from '@/components/trip-expense-distribution';
import { budgetsService } from '@/services/budgetsService';
import { expensesService } from '@/services/expensesService';
import { useBoardsStore } from '@/store/boardsStore';
import { Budget } from '@/types/budget';
import { Expense } from '@/types/expense';

export default function DashboardPage() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const isLoadingBoards = useBoardsStore((state) => state.isLoading);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudgetedExpenses, setTotalBudgetedExpenses] = useState(0);
  const [totalUnbudgetedExpenses, setTotalUnbudgetedExpenses] = useState(0);
  const [budgetsStatus, setBudgetsStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const activeBoard = currentBoard || boards[0];
  const isEverydayBoard = activeBoard?.type === 'everyday';

  useEffect(() => {
    if (
      !activeBoard ||
      activeBoard._id.startsWith('mock-') ||
      isEverydayBoard
    ) {
      return;
    }

    let stale = false;

    const fetchData = async () => {
      setBudgetsStatus('loading');
      setBudgets([]);
      setExpenses([]);
      setTotalExpenses(0);
      setTotalBudgetedExpenses(0);
      setTotalUnbudgetedExpenses(0);

      try {
        const [budgetsResult, expensesResult] = await Promise.allSettled([
          budgetsService.getAllBudgetsByTrip(activeBoard._id),
          expensesService.getExpenses(activeBoard._id),
        ]);

        if (stale) return;

        if (budgetsResult.status === 'fulfilled') {
          setBudgets(budgetsResult.value.budgets);
          setBudgetsStatus('success');
        } else {
          console.error('Error al cargar presupuestos:', budgetsResult.reason);
          setBudgets([]);
          setBudgetsStatus('error');
        }

        const loadedExpenses =
          expensesResult.status === 'fulfilled'
            ? expensesResult.value.expenses
            : [];

        if (expensesResult.status === 'rejected') {
          console.error('Error al cargar gastos:', expensesResult.reason);
        }

        setExpenses(loadedExpenses);

        const total = loadedExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
        setTotalExpenses(total);

        const totalWithBudget = loadedExpenses
          .filter((expense) => expense.budgetId)
          .reduce((sum, expense) => sum + expense.amount, 0);
        setTotalBudgetedExpenses(totalWithBudget);

        const totalWithoutBudget = loadedExpenses
          .filter((expense) => !expense.budgetId)
          .reduce((sum, expense) => sum + expense.amount, 0);
        setTotalUnbudgetedExpenses(totalWithoutBudget);
      } catch (error) {
        if (!stale) {
          console.error('Error al cargar datos:', error);
          setBudgets([]);
          setBudgetsStatus('error');
          setExpenses([]);
          setTotalExpenses(0);
          setTotalBudgetedExpenses(0);
          setTotalUnbudgetedExpenses(0);
        }
      }
    };

    void fetchData();

    return () => {
      stale = true;
    };
  }, [activeBoard, refreshTrigger, isEverydayBoard]);

  useEffect(() => {
    const onExpensesChanged = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
    return () =>
      window.removeEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
  }, []);

  if (!isLoadingBoards && !activeBoard) {
    return <EmptyBoardState />;
  }

  if (!activeBoard) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Cargando tableros…
      </div>
    );
  }

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
      <div className="px-2 sm:px-4 pt-4 lg:px-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            {activeBoard.name}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isEverydayBoard
              ? 'Resumen y proyección mensual'
              : 'Home del tablero activo'}
          </p>
        </div>

        {isEverydayBoard ? (
          <EverydayBoardHome
            board={activeBoard}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        ) : (
          <>
            {activeBoard._id.startsWith('mock-') ? (
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
                Estás viendo mocks locales. Cambiá el tablero activo desde el
                selector para validar el shell.
              </div>
            ) : (
              <>
                <TripDashboardCards
                  board={activeBoard}
                  tripId={activeBoard._id}
                  tripName={activeBoard.name}
                  budgets={budgets}
                  budgetsStatus={budgetsStatus}
                  totalExpenses={totalExpenses}
                  totalBudgetedExpenses={totalBudgetedExpenses}
                  totalUnbudgetedExpenses={totalUnbudgetedExpenses}
                  currency={activeBoard.baseCurrency}
                  expenses={expenses}
                  onBudgetsChange={handleRefresh}
                />
                <div className="mt-4">
                  <TripExpenseDistribution
                    expenses={expenses}
                    currency={activeBoard.baseCurrency}
                    mode="categories"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!isEverydayBoard && !activeBoard._id.startsWith('mock-') && (
        <div className="space-y-4 px-2 pb-4 sm:px-4 lg:px-6">
          <div>
            <RecentExpensesTable
              tripId={activeBoard._id}
              refreshTrigger={refreshTrigger}
              onRefresh={handleRefresh}
            />
          </div>

          <TripExpenseDistribution
            expenses={expenses}
            currency={activeBoard.baseCurrency}
            mode="participants"
          />

          <div>
            <StatisticsCards />
          </div>

          <section className="space-y-3 pt-2">
            <div>
              <h3 className="font-display text-lg font-semibold">
                Presupuesto
              </h3>
              <p className="text-sm text-muted-foreground">
                Opcional para controlar el gasto del viaje.
              </p>
            </div>
            <TripDashboardCards
              board={activeBoard}
              budgetOnly
              tripId={activeBoard._id}
              tripName={activeBoard.name}
              budgets={budgets}
              budgetsStatus={budgetsStatus}
              totalExpenses={totalExpenses}
              totalBudgetedExpenses={totalBudgetedExpenses}
              totalUnbudgetedExpenses={totalUnbudgetedExpenses}
              currency={activeBoard.baseCurrency}
              expenses={expenses}
              onBudgetsChange={handleRefresh}
            />
            {budgets.length > 0 && (
              <BudgetsOverview
                tripName={activeBoard.name}
                budgets={budgets}
                expenses={expenses}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
