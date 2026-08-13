import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BoardForecastSection } from '@/components/board-forecast-section';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { HomeMonthViewToggle } from '@/components/home-month-view-toggle';
import { MonthlyPlanningCards } from '@/components/monthly-planning-cards';
import { MonthBudgetsProgress } from '@/components/month-budgets-progress';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import {
  readHomeMonthView,
  writeHomeMonthView,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';
import { boardMonthBudgetsService } from '@/services/boardMonthBudgetsService';
import { expensesService } from '@/services/expensesService';
import { forecastService } from '@/services/forecastService';
import { incomesService } from '@/services/incomesService';
import type { Board } from '@/types/board';
import type { BoardMonthBudgetProgress } from '@/types/board-month-budget';
import type { Expense } from '@/types/expense';
import type { MonthlyForecast } from '@/types/forecast';
import { IncomeStatus, type Income } from '@/types/income';
import {
  formatCurrency,
  formatDate,
  getCurrentYearMonth,
  isDateInYearMonth,
} from '@/lib/utils';
import { useIncomesChangedRefresh } from '@/hooks/useIncomesChangedRefresh';

interface EverydayBoardHomeProps {
  board: Board;
  refreshTrigger: number;
  onRefresh: () => void;
}

export function EverydayBoardHome({
  board,
  refreshTrigger,
  onRefresh,
}: EverydayBoardHomeProps) {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());
  const [monthView, setMonthView] = useState<HomeMonthView>(() =>
    readHomeMonthView(),
  );
  const { categories } = useBoardCategories(board._id);
  const { paymentMethods } = useAvailablePaymentMethods(board._id);

  const [forecast, setForecast] = useState<MonthlyForecast | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<
    BoardMonthBudgetProgress[]
  >([]);
  const [monthIncomes, setMonthIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const incomesChangedRefresh = useIncomesChangedRefresh();

  const paymentMethodMap = useMemo(
    () => new Map(paymentMethods.map((method) => [method._id, method])),
    [paymentMethods],
  );

  useEffect(() => {
    writeHomeMonthView(monthView);
  }, [monthView]);

  useEffect(() => {
    if (board._id.startsWith('mock-')) {
      return;
    }

    let stale = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [forecastResult, progressResult, incomesResult] =
          await Promise.all([
            forecastService
              .getMonthlyForecast(board._id, yearMonth, monthView)
              .then(({ forecast: f }) => f)
              .catch(() => null),
            boardMonthBudgetsService
              .getProgress(board._id, yearMonth)
              .then(({ progress }) => progress)
              .catch(() => []),
            incomesService
              .getIncomes(board._id)
              .then(({ incomes }) => incomes)
              .catch(() => []),
          ]);

        if (stale) return;

        setForecast(forecastResult);
        setBudgetProgress(progressResult);
        setMonthIncomes(
          incomesResult
            .filter(
              (income) =>
                isDateInYearMonth(income.incomeDate, yearMonth) &&
                (income.status ?? IncomeStatus.CONFIRMED) ===
                  IncomeStatus.CONFIRMED,
            )
            .sort(
              (a, b) =>
                new Date(b.incomeDate).getTime() -
                new Date(a.incomeDate).getTime(),
            ),
        );
      } finally {
        if (!stale) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      stale = true;
    };
  }, [board._id, yearMonth, monthView, refreshTrigger, incomesChangedRefresh]);

  const currency = forecast?.currency ?? board.baseCurrency;

  const handleIncomeCreated = () => {
    onRefresh();
  };

  const openEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeSheetOpen(true);
  };

  const handleDeleteIncome = async (income: Income) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el ingreso "${income.label}"?`,
      )
    ) {
      return;
    }

    try {
      await incomesService.deleteIncome(income._id);
      toast.success('Ingreso eliminado');
      onRefresh();
    } catch {
      toast.error('Error al eliminar el ingreso');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }

    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('Gasto eliminado');
      onRefresh();
    } catch {
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleExpenseSuccess = () => {
    setIsExpenseDialogOpen(false);
    setSelectedExpense(null);
    onRefresh();
  };

  const handleIncomeSheetOpenChange = (open: boolean) => {
    setIsIncomeSheetOpen(open);
    if (!open) {
      setEditingIncome(null);
    }
  };

  if (board._id.startsWith('mock-')) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
        Estás viendo mocks locales. Cambiá el tablero activo desde el selector
        para validar el home mensual.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YearMonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <HomeMonthViewToggle value={monthView} onChange={setMonthView} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : forecast ? (
        <MonthlyPlanningCards forecast={forecast} monthView={monthView} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No se pudo cargar el resumen del mes. Reintentá en unos segundos.
          </CardContent>
        </Card>
      )}

      {!isLoading && forecast ? (
        <BoardForecastSection
          incomes={forecast.planned.incomes}
          fixedExpenses={forecast.planned.fixedExpenses}
          installments={forecast.planned.installments}
          currency={currency}
          isFutureMonth={forecast.isFutureMonth}
          onRefresh={onRefresh}
        />
      ) : null}

      {!isLoading && (
        <MonthBudgetsProgress
          progress={budgetProgress}
          categories={categories}
          yearMonth={yearMonth}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos ingresos</CardTitle>
          <CardDescription>
            Puntuales y recurrentes confirmados en {yearMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : monthIncomes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin ingresos confirmados este mes. Los pendientes aparecen en
              compromisos de arriba.
            </p>
          ) : (
            <ul className="divide-y">
              {monthIncomes.map((income) => (
                <li
                  key={income._id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{income.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(income.incomeDate)}
                      {income.recurringIncomeId ? ' · Recurrente' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                      +{formatCurrency(income.amount, income.currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditIncome(income)}
                      aria-label="Editar ingreso"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!income.recurringIncomeId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => void handleDeleteIncome(income)}
                        aria-label="Eliminar ingreso"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div>
        <RecentExpensesTable
          tripId={board._id}
          boardCurrency={currency}
          yearMonth={yearMonth}
          monthView={monthView}
          paymentMethodMap={paymentMethodMap}
          viewAllHref={`/expenses?yearMonth=${yearMonth}&view=${monthView}`}
          onRefresh={onRefresh}
          refreshTrigger={refreshTrigger}
          onEdit={handleEditExpense}
          onDelete={(expenseId) => void handleDeleteExpense(expenseId)}
        />
      </div>

      <CreateIncomeSheet
        open={isIncomeSheetOpen}
        onOpenChange={handleIncomeSheetOpenChange}
        boardId={board._id}
        currency={currency}
        income={editingIncome}
        onSuccess={handleIncomeCreated}
      />

      <ExpenseFormDialog
        open={isExpenseDialogOpen}
        onOpenChange={(open) => {
          setIsExpenseDialogOpen(open);
          if (!open) {
            setSelectedExpense(null);
          }
        }}
        board={board}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </div>
  );
}
