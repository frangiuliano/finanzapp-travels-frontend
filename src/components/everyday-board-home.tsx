import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BoardForecastSection } from '@/components/board-forecast-section';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
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
import { expensesService } from '@/services/expensesService';
import { incomesService } from '@/services/incomesService';
import type { Board } from '@/types/board';
import { getExpenseCategoryLabel, type Expense } from '@/types/expense';
import { STATUS_INSIGHT_TYPES } from '@/types/insight';
import type { Income } from '@/types/income';
import {
  formatCurrency,
  formatDate,
  formatYearMonth,
  getDefaultViewYearMonth,
} from '@/lib/utils';
import { triggerDestructiveHaptic } from '@/lib/haptics';
import { useIncomesChangedRefresh } from '@/hooks/useIncomesChangedRefresh';
import { useEverydayHomeData } from '@/hooks/useEverydayHomeData';

const EMPTY_INCOMES: Income[] = [];
const EMPTY_EXPENSES: Expense[] = [];

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
  const [yearMonth, setYearMonth] = useState(getDefaultViewYearMonth());
  const { categories } = useBoardCategories(board._id);

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

  const queries = useEverydayHomeData(
    board._id,
    yearMonth,
    refreshTrigger,
    incomesChangedRefresh,
  );
  const forecast = queries.forecast.data?.forecast;
  const firstInsight = queries.insights.data?.insights.insights[0];
  const topInsight =
    firstInsight && !STATUS_INSIGHT_TYPES.has(firstInsight.type)
      ? firstInsight
      : null;
  const budgetProgress = queries.budgets.data?.progress ?? [];
  const monthIncomes = queries.incomes.data?.incomes ?? EMPTY_INCOMES;
  const monthExpenses = queries.expenses.data?.expenses ?? EMPTY_EXPENSES;
  const isLoading = queries.forecast.isPending;
  const movementsLoading =
    queries.incomes.isPending || queries.expenses.isPending;

  const recentMovements = useMemo(
    () =>
      [
        ...monthExpenses.map((expense) => ({
          id: expense._id,
          type: 'expense' as const,
          date: expense.expenseDate || expense.createdAt,
          createdAt: expense.createdAt,
          label: expense.merchantName || expense.description,
          secondaryLabel:
            expense.merchantName &&
            expense.description &&
            expense.merchantName !== expense.description
              ? expense.description
              : null,
          meta: expense.isRefund
            ? `${getExpenseCategoryLabel(expense.category) || 'Gasto'} · Devolución`
            : getExpenseCategoryLabel(expense.category) || 'Gasto',
          amount: expense.amount,
          currency: expense.currency,
          expense,
        })),
        ...monthIncomes.map((income) => ({
          id: income._id,
          type: 'income' as const,
          date: income.incomeDate,
          createdAt: income.createdAt,
          label: income.label,
          secondaryLabel: null,
          meta: income.recurringIncomeId
            ? 'Ingreso recurrente'
            : 'Ingreso puntual',
          amount: income.amount,
          currency: income.currency,
          income,
        })),
      ]
        // "Últimos movimientos" = orden de carga real, no la fecha informativa
        // (expenseDate/incomeDate) que el usuario puede elegir libremente.
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
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

  const handleEditExpense = async (expense: Expense) => {
    try {
      const result = await expensesService.getExpenseById(expense._id);
      setSelectedExpense(result.expense);
      setIsExpenseDialogOpen(true);
    } catch {
      toast.error('No se pudo cargar el gasto para editar');
    }
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

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : forecast ? (
        <MonthlyPlanningCards forecast={forecast} topInsight={topInsight} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No se pudo cargar el resumen del mes. Reintentá en unos segundos.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos movimientos</CardTitle>
          <CardDescription>
            Ingresos y gastos confirmados en {yearMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : queries.incomes.isError || queries.expenses.isError ? (
            <p className="py-4 text-sm text-muted-foreground">
              No se pudieron cargar los últimos movimientos. Reintentá en unos
              segundos.
            </p>
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
                    {movement.secondaryLabel ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {movement.secondaryLabel}
                      </span>
                    ) : null}
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatDate(movement.date)} · {movement.meta}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      movement.type === 'income' ||
                      (movement.type === 'expense' && movement.amount < 0)
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {movement.type === 'income' || movement.amount < 0
                      ? '+'
                      : '−'}
                    {formatCurrency(
                      Math.abs(movement.amount),
                      movement.currency,
                    )}
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
            <Link to={`/expenses?yearMonth=${yearMonth}`}>
              Ver todos los movimientos
            </Link>
          </Button>
        </CardContent>
      </Card>

      <GoalPriorityWidget query={queries.goal} yearMonth={yearMonth} />

      {!isLoading && forecast ? (
        <BoardForecastSection
          incomes={forecast.planned.incomes}
          fixedExpenses={forecast.planned.fixedExpenses}
          installments={forecast.planned.installments}
          isFutureMonth={forecast.isFutureMonth}
          onRefresh={onRefresh}
        />
      ) : null}

      {!queries.budgets.isPending && (
        <MonthBudgetsProgress
          progress={budgetProgress}
          categories={categories}
          yearMonth={yearMonth}
        />
      )}

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

/**
 * Compact, read-only teaser for the highest-priority active goal. Shows two
 * numbers side by side, both for the viewed month specifically:
 * - "Aportás este mes": how much of that month's own Restante proyectado is
 *   being counted toward the goal (capped at the flat requirement below).
 * - "Deberías aportar": the flat monthly requirement to reach the goal on
 *   time — the same figure shown as "Aporte mensual" on the /goals card.
 *
 * Pure display — never touches Restante proyectado, disponible, or goal
 * data. Hidden once the viewed month is past the goal's own projected
 * completion (see GoalsService.getPrioritySummary) — nothing left to plan.
 */
function GoalPriorityWidget({
  query,
  yearMonth,
}: {
  query: ReturnType<typeof useEverydayHomeData>['goal'];
  yearMonth: string;
}) {
  if (query.isLoading) return <Skeleton className="h-[104px] rounded-xl" />;
  if (query.isError) return null;

  const data = query.data;
  if (!data?.goal || !data.computable) return null;
  const {
    goal,
    neededThisMonth,
    thisMonthContribution,
    requiredMonthlyContribution,
    isFullyCovered,
  } = data;
  if (neededThisMonth === null || neededThisMonth === undefined) return null;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Link
          to="/goals"
          className="flex min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg"
            aria-hidden="true"
          >
            {goal.icon || <Target className="size-4 text-primary" />}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm">{goal.name}</strong>
            <span className="block truncate text-xs text-muted-foreground">
              {formatYearMonth(yearMonth)}
              {isFullyCovered ? ' · Al día' : ''}
            </span>
          </span>
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              Aportás este mes
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {formatCurrency(thisMonthContribution ?? 0, goal.currency)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              Deberías aportar
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {formatCurrency(requiredMonthlyContribution ?? 0, goal.currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
