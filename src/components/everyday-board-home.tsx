import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BoardForecastSection } from '@/components/board-forecast-section';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { HomeMonthViewToggle } from '@/components/home-month-view-toggle';
import { MonthlyPlanningCards } from '@/components/monthly-planning-cards';
import { MonthBudgetsProgress } from '@/components/month-budgets-progress';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import {
  readHomeMonthView,
  writeHomeMonthView,
  expenseBelongsToYearMonth,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';
import { getExpenseQueryDateRange } from '@/lib/expense-query-range';
import { boardMonthBudgetsService } from '@/services/boardMonthBudgetsService';
import { expensesService } from '@/services/expensesService';
import { forecastService } from '@/services/forecastService';
import { incomesService } from '@/services/incomesService';
import type { Board } from '@/types/board';
import type { BoardMonthBudgetProgress } from '@/types/board-month-budget';
import { getExpenseCategoryLabel, type Expense } from '@/types/expense';
import type { MonthlyForecast } from '@/types/forecast';
import { IncomeStatus, type Income } from '@/types/income';
import {
  formatCurrency,
  formatDate,
  getCurrentYearMonth,
  isDateInYearMonth,
} from '@/lib/utils';
import { triggerDestructiveHaptic } from '@/lib/haptics';
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
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'income'; income: Income }
    | { type: 'expense'; expenseId: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        const { from, to } = getExpenseQueryDateRange(yearMonth, monthView);
        const [forecastResult, progressResult, incomesResult, expensesResult] =
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
            expensesService
              .listExpenses(board._id, { from, to })
              .then(({ expenses }) => expenses)
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
        setMonthExpenses(
          expensesResult
            .filter((expense) =>
              expenseBelongsToYearMonth(
                expense,
                yearMonth,
                monthView,
                paymentMethodMap,
              ),
            )
            .sort(
              (a, b) =>
                new Date(b.expenseDate || b.createdAt).getTime() -
                new Date(a.expenseDate || a.createdAt).getTime(),
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
  }, [
    board._id,
    yearMonth,
    monthView,
    refreshTrigger,
    incomesChangedRefresh,
    paymentMethodMap,
  ]);

  const recentMovements = useMemo(
    () =>
      [
        ...monthExpenses.map((expense) => ({
          id: expense._id,
          type: 'expense' as const,
          date: expense.expenseDate || expense.createdAt,
          label: expense.description,
          meta: getExpenseCategoryLabel(expense.category) || 'Gasto',
          amount: expense.amount,
          currency: expense.currency,
          expense,
        })),
        ...monthIncomes.map((income) => ({
          id: income._id,
          type: 'income' as const,
          date: income.incomeDate,
          label: income.label,
          meta: income.recurringIncomeId
            ? 'Ingreso recurrente'
            : 'Ingreso puntual',
          amount: income.amount,
          currency: income.currency,
          income,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [monthExpenses, monthIncomes],
  );

  const currency = forecast?.currency ?? board.baseCurrency;

  const handleIncomeCreated = () => {
    onRefresh();
  };

  const openEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeSheetOpen(true);
  };

  const handleDeleteIncome = async (income: Income) => {
    setIsDeleting(true);
    try {
      await incomesService.deleteIncome(income._id);
      toast.success('Ingreso eliminado');
      triggerDestructiveHaptic();
      setDeleteTarget(null);
      onRefresh();
    } catch {
      toast.error('Error al eliminar el ingreso');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setIsDeleting(true);
    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('Gasto eliminado');
      triggerDestructiveHaptic();
      setDeleteTarget(null);
      onRefresh();
    } catch {
      toast.error('Error al eliminar el gasto');
    } finally {
      setIsDeleting(false);
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
        Este tablero de ejemplo no tiene un resumen mensual. Elegí otro tablero
        desde el selector para ver tus movimientos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YearMonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <HomeMonthViewToggle value={monthView} onChange={setMonthView} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
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
          <CardTitle className="text-lg">Últimos movimientos</CardTitle>
          <CardDescription>
            Ingresos y gastos confirmados en {yearMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Wallet className="mb-3 size-9 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Todavía no hay movimientos confirmados este mes.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentMovements.map((movement) => (
                <li
                  key={`${movement.type}-${movement.id}`}
                  className="flex min-h-16 items-center gap-3 py-2"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      movement.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {movement.type === 'income' ? (
                      <ArrowDownLeft className="size-4" aria-hidden />
                    ) : (
                      <ArrowUpRight className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {movement.label}
                    </strong>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatDate(movement.date)} · {movement.meta}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      movement.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {movement.type === 'income' ? '+' : '−'}
                    {formatCurrency(movement.amount, movement.currency)}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10"
                      onClick={() =>
                        movement.type === 'income'
                          ? openEditIncome(movement.income)
                          : handleEditExpense(movement.expense)
                      }
                      aria-label={`Editar ${movement.type === 'income' ? 'ingreso' : 'gasto'}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {movement.type === 'expense' ||
                    !movement.income.recurringIncomeId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        onClick={() =>
                          movement.type === 'income'
                            ? setDeleteTarget({
                                type: 'income',
                                income: movement.income,
                              })
                            : setDeleteTarget({
                                type: 'expense',
                                expenseId: movement.id,
                              })
                        }
                        aria-label={`Eliminar ${movement.type === 'income' ? 'ingreso' : 'gasto'}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="link" className="mt-3 h-auto px-0">
            <Link to={`/expenses?yearMonth=${yearMonth}&view=${monthView}`}>
              Ver todos los movimientos
            </Link>
          </Button>
        </CardContent>
      </Card>

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

      <DestructiveActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === 'income'
            ? `Eliminar “${deleteTarget.income.label}”`
            : 'Eliminar gasto'
        }
        description="Este movimiento se eliminará definitivamente y los totales del mes se recalcularán. Esta acción no se puede deshacer."
        confirmLabel="Eliminar movimiento"
        isPending={isDeleting}
        onConfirm={() => {
          if (deleteTarget?.type === 'income') {
            return handleDeleteIncome(deleteTarget.income);
          }
          if (deleteTarget?.type === 'expense') {
            return handleDeleteExpense(deleteTarget.expenseId);
          }
        }}
      />
    </div>
  );
}
