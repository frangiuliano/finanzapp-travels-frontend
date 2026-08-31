import { useEffect, useMemo, useState } from 'react';
import { useExpensesChangedRefresh } from '@/hooks/useExpensesChangedRefresh';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Pencil,
  Trash2,
  WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { HomeMonthViewToggle } from '@/components/home-month-view-toggle';
import { StatStrip } from '@/components/stat-strip';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { requestConfirmation } from '@/lib/confirmation-events';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useIncomesChangedRefresh } from '@/hooks/useIncomesChangedRefresh';
import { getExpenseAmountInBoardCurrency } from '@/lib/expense-currency';
import {
  expenseBelongsToYearMonth,
  readHomeMonthView,
  writeHomeMonthView,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';
import { getExpenseQueryDateRange } from '@/lib/expense-query-range';
import { expensesService } from '@/services/expensesService';
import { incomesService } from '@/services/incomesService';
import type { Income } from '@/types/income';
import { isDateInYearMonth } from '@/lib/utils';
import { openMovementCreator } from '@/lib/movement-events';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Board } from '@/types/board';
import {
  Expense,
  ExpenseStatus,
  getExpenseCategoryLabel,
} from '@/types/expense';
import { PAYMENT_METHOD_KIND_LABELS } from '@/types/payment-method';
import {
  cn,
  formatCurrency,
  formatDate,
  getCurrentYearMonth,
} from '@/lib/utils';

const ALL_FILTER = 'all';

interface ExpensesExplorerSectionProps {
  board: Board;
  initialYearMonth?: string;
  initialMonthView?: HomeMonthView;
  initialPaymentMethodId?: string;
}

function resolvePaymentMethodLabel(
  expense: Expense,
  paymentMethodNameById: Map<string, string>,
): string {
  const methodId = expense.paymentMethodId ?? expense.cardId;
  if (methodId && paymentMethodNameById.has(methodId)) {
    return paymentMethodNameById.get(methodId)!;
  }

  if (expense.card?.name) {
    const suffix = expense.card.lastFourDigits
      ? ` ··${expense.card.lastFourDigits}`
      : '';
    return `${expense.card.name}${suffix}`;
  }

  return 'Sin medio';
}

export function ExpensesExplorerSection({
  board,
  initialYearMonth,
  initialMonthView,
  initialPaymentMethodId,
}: ExpensesExplorerSectionProps) {
  const [yearMonth, setYearMonth] = useState(
    initialYearMonth ?? getCurrentYearMonth(),
  );
  const [monthView, setMonthView] = useState<HomeMonthView>(
    initialMonthView ?? readHomeMonthView(),
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    initialPaymentMethodId ?? ALL_FILTER,
  );
  const [categoryId, setCategoryId] = useState(ALL_FILTER);
  const [status, setStatus] = useState(ALL_FILTER);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [movementType, setMovementType] = useState<
    'all' | 'expense' | 'income'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [detail, setDetail] = useState<{
    type: 'expense' | 'income';
    id: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'expense' | 'income';
    id: string;
    label: string;
    isRecurringOccurrence?: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const expensesChangedRefresh = useExpensesChangedRefresh();
  const incomesChangedRefresh = useIncomesChangedRefresh();

  const { paymentMethods } = useAvailablePaymentMethods(board._id);
  const { categories } = useBoardCategories(board._id);

  const paymentMethodMap = useMemo(
    () => new Map(paymentMethods.map((method) => [method._id, method])),
    [paymentMethods],
  );

  const paymentMethodNameById = useMemo(
    () => new Map(paymentMethods.map((method) => [method._id, method.name])),
    [paymentMethods],
  );

  useEffect(() => {
    writeHomeMonthView(monthView);
  }, [monthView]);

  useEffect(() => {
    setPageIndex(0);
  }, [yearMonth, monthView, paymentMethodId, categoryId, status, movementType]);

  useEffect(() => {
    if (board._id.startsWith('mock-')) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    let stale = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { from, to } = getExpenseQueryDateRange(yearMonth, monthView);
        const { expenses: items } = await expensesService.listExpenses(
          board._id,
          {
            from,
            to,
            paymentMethodId:
              paymentMethodId === ALL_FILTER ? undefined : paymentMethodId,
            categoryId: categoryId === ALL_FILTER ? undefined : categoryId,
            status:
              status === ALL_FILTER ? undefined : (status as ExpenseStatus),
          },
        );

        if (stale) return;

        const filtered = items
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
          );

        setExpenses(filtered);
      } catch {
        if (!stale) {
          toast.error('No se pudieron cargar los gastos');
          setExpenses([]);
        }
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
    paymentMethodId,
    categoryId,
    status,
    paymentMethodMap,
    expensesChangedRefresh,
  ]);

  useEffect(() => {
    let stale = false;
    setIsIncomeLoading(true);
    void incomesService
      .getIncomes(board._id)
      .then(({ incomes: items }) => {
        if (!stale)
          setIncomes(
            items.filter((item) =>
              isDateInYearMonth(item.incomeDate, yearMonth),
            ),
          );
      })
      .catch(() => {
        if (!stale) setIncomes([]);
      })
      .finally(() => {
        if (!stale) setIsIncomeLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [board._id, yearMonth, incomesChangedRefresh]);

  const isMovementLoading =
    movementType === 'expense'
      ? isLoading
      : movementType === 'income'
        ? isIncomeLoading
        : isLoading || isIncomeLoading;

  const movements = useMemo(
    () =>
      [
        ...(movementType !== 'income'
          ? expenses.map((expense) => ({
              id: expense._id,
              type: 'expense' as const,
              date: expense.expenseDate || expense.createdAt,
              label: expense.description,
              meta: `${getExpenseCategoryLabel(expense.category) || 'Gasto'} · ${resolvePaymentMethodLabel(expense, paymentMethodNameById)}`,
              amount: expense.amount,
              currency: expense.currency,
              expense,
            }))
          : []),
        ...(movementType !== 'expense'
          ? incomes.map((income) => ({
              id: income._id,
              type: 'income' as const,
              date: income.incomeDate,
              label: income.label,
              meta: `${income.recurringIncomeId ? 'Ingreso recurrente' : 'Ingreso puntual'} · ${income.status === 'pending' ? 'Pendiente' : 'Cobrado'}`,
              amount: income.amount,
              currency: income.currency,
              income,
            }))
          : []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, incomes, movementType, paymentMethodNameById],
  );

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(movements.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageMovements = movements.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  const totals = useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    let excludedExpenses = 0;
    let excludedIncomes = 0;

    for (const expense of expenses) {
      const amount = getExpenseAmountInBoardCurrency(
        expense,
        board.baseCurrency,
      );
      if (amount == null) {
        excludedExpenses += 1;
        continue;
      }
      expenseTotal += amount;
    }

    for (const income of incomes) {
      if (income.currency !== board.baseCurrency) {
        excludedIncomes += 1;
        continue;
      }
      incomeTotal += income.amount;
    }

    return {
      expenseTotal,
      incomeTotal,
      excludedExpenses,
      excludedIncomes,
    };
  }, [expenses, incomes, board.baseCurrency]);

  const handleDelete = async (expenseId: string) => {
    setIsDeleting(true);
    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('Gasto eliminado');
      setExpenses((current) =>
        current.filter((item) => item._id !== expenseId),
      );
      setDetail(null);
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el gasto');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    setIsDeleting(true);
    try {
      await incomesService.deleteIncome(incomeId);
      setIncomes((current) => current.filter((item) => item._id !== incomeId));
      setDetail(null);
      setDeleteTarget(null);
      toast.success('Ingreso eliminado');
    } catch {
      toast.error('No se pudo eliminar el ingreso');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSkipIncome = async (incomeId: string) => {
    if (
      !(await requestConfirmation({
        title: '¿Omitir este ingreso?',
        description:
          'Solo se omitirá esta ocurrencia. La recurrencia continuará normalmente los demás meses.',
        confirmLabel: 'Omitir ocurrencia',
        action: 'discard',
      }))
    ) {
      return;
    }
    try {
      await incomesService.skipIncome(incomeId);
      setIncomes((current) => current.filter((item) => item._id !== incomeId));
      setDetail(null);
      toast.success('Ocurrencia omitida');
    } catch {
      toast.error('No se pudo omitir esta ocurrencia');
    }
  };

  const detailMovement = detail
    ? movements.find(
        (movement) =>
          movement.type === detail.type && movement.id === detail.id,
      )
    : undefined;

  const handleExpenseSuccess = () => {
    setIsExpenseDialogOpen(false);
    setSelectedExpense(null);
    setPageIndex(0);
    const { from, to } = getExpenseQueryDateRange(yearMonth, monthView);
    void expensesService
      .listExpenses(board._id, {
        from,
        to,
        paymentMethodId:
          paymentMethodId === ALL_FILTER ? undefined : paymentMethodId,
        categoryId: categoryId === ALL_FILTER ? undefined : categoryId,
        status: status === ALL_FILTER ? undefined : (status as ExpenseStatus),
      })
      .then(({ expenses: items }) => {
        setExpenses(
          items
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
      })
      .catch(() => {
        toast.error('No se pudieron actualizar los gastos');
      });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Movimientos
        </h1>
        <p className="text-sm text-muted-foreground">
          Contexto:{' '}
          <span className="font-medium text-foreground">{board.name}</span>
        </p>
      </div>

      <YearMonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <HomeMonthViewToggle value={monthView} onChange={setMonthView} />

      <div className="flex items-center gap-2">
        <Tabs
          value={movementType}
          onValueChange={(value) =>
            setMovementType(value as typeof movementType)
          }
          className="min-w-0 flex-1"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="expense">Gastos</TabsTrigger>
            <TabsTrigger value="income">Ingresos</TabsTrigger>
          </TabsList>
        </Tabs>
        {movementType !== 'income' ? (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl sm:hidden"
            onClick={() => setShowFilters((value) => !value)}
            aria-label="Mostrar filtros de gastos"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        ) : null}
      </div>

      {movementType !== 'income' ? (
        <Card className={showFilters ? '' : 'hidden sm:block'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>
              {movementType === 'all'
                ? 'Estos filtros se aplican únicamente a los gastos; los ingresos no se modifican.'
                : 'Filtrá gastos por medio de pago, categoría y estado.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="expense-filter-payment">Medio de pago</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger
                  id="expense-filter-payment"
                  className="rounded-xl"
                >
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Todos los medios</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method._id} value={method._id}>
                      {method.name} ({PAYMENT_METHOD_KIND_LABELS[method.kind]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-filter-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  id="expense-filter-category"
                  className="rounded-xl"
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>
                    Todas las categorías
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-filter-status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  id="expense-filter-status"
                  className="rounded-xl"
                >
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Todos</SelectItem>
                  <SelectItem value={ExpenseStatus.PAID}>Pagado</SelectItem>
                  <SelectItem value={ExpenseStatus.PENDING}>
                    Pendiente
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <StatStrip
        centered
        loading={isMovementLoading}
        items={[
          {
            label:
              movementType === 'expense'
                ? 'Gastos encontrados'
                : movementType === 'income'
                  ? 'Ingresos encontrados'
                  : 'Movimientos',
            value: movements.length,
          },
          {
            label: movementType === 'income' ? 'Entradas' : 'Salidas',
            value:
              movementType === 'income'
                ? totals.incomeTotal
                : totals.expenseTotal,
            currency: board.baseCurrency,
            sign: movementType === 'income' ? '+' : '−',
            description:
              !isMovementLoading &&
              (movementType === 'income'
                ? totals.excludedIncomes
                : totals.excludedExpenses) > 0
                ? `${movementType === 'income' ? totals.excludedIncomes : totals.excludedExpenses} en otra moneda no incluidos.`
                : undefined,
          },
          ...(movementType === 'all'
            ? [
                {
                  label: 'Entradas',
                  value: totals.incomeTotal,
                  currency: board.baseCurrency,
                  sign: '+' as const,
                  description:
                    !isMovementLoading && totals.excludedIncomes > 0
                      ? `${totals.excludedIncomes} ingresos en otra moneda no incluidos.`
                      : undefined,
                },
              ]
            : []),
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle</CardTitle>
          <CardDescription>
            {monthView === 'cash_impact'
              ? `Movimientos que impactan en ${yearMonth}`
              : `Movimientos con fecha de compra en ${yearMonth}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMovementLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <WalletIcon className="mb-3 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Todavía no hay movimientos con estos filtros.
              </p>
              <Button
                variant="link"
                className="mt-2"
                onClick={openMovementCreator}
              >
                + Registrar movimiento
              </Button>
            </div>
          ) : (
            <>
              <ul className="divide-y sm:hidden">
                {pageMovements.map((movement) => (
                  <li key={`${movement.type}-${movement.id}`}>
                    <button
                      type="button"
                      className="flex min-h-16 w-full items-center gap-3 rounded-xl py-3 text-left focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() =>
                        setDetail({ type: movement.type, id: movement.id })
                      }
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full',
                          movement.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {movement.type === 'income' ? (
                          <ArrowDownLeft
                            className="size-4"
                            aria-label="Ingreso"
                          />
                        ) : (
                          <ArrowUpRight className="size-4" aria-label="Gasto" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block break-words text-sm">
                          {movement.label}
                        </strong>
                        <span className="block break-words text-xs text-muted-foreground">
                          {formatDate(movement.date)} · {movement.meta}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                        <span className="sr-only">
                          {movement.type === 'income' ? 'Entrada' : 'Salida'}
                          :{' '}
                        </span>
                        {movement.type === 'income' ? '+' : '−'}
                        {formatCurrency(movement.amount, movement.currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-lg border sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Categoría
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Medio
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Estado
                      </TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageMovements.map((movement) => (
                      <TableRow
                        key={`${movement.type}-${movement.id}`}
                        className="cursor-pointer"
                        onClick={() =>
                          setDetail({ type: movement.type, id: movement.id })
                        }
                      >
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(movement.date)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] font-medium sm:max-w-xs">
                          <span className="block truncate">
                            {movement.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {movement.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {movement.type === 'expense'
                            ? getExpenseCategoryLabel(
                                movement.expense.category,
                              ) || '—'
                            : 'Ingreso'}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {movement.type === 'expense'
                            ? resolvePaymentMethodLabel(
                                movement.expense,
                                paymentMethodNameById,
                              )
                            : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {movement.type === 'expense'
                            ? movement.expense.status === ExpenseStatus.PAID
                              ? 'Pagado'
                              : 'Pendiente'
                            : 'Ingreso'}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          <span className="sr-only">
                            {movement.type === 'income' ? 'Entrada' : 'Salida'}
                            :{' '}
                          </span>
                          {movement.type === 'income' ? '+' : '−'}
                          {formatCurrency(movement.amount, movement.currency)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDetail({
                                type: movement.type,
                                id: movement.id,
                              });
                            }}
                            aria-label={`Ver detalle de ${movement.type === 'income' ? 'ingreso' : 'gasto'}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pageCount > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Página {currentPage + 1} de {pageCount}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={currentPage === 0}
                      onClick={() => setPageIndex(0)}
                      aria-label="Primera página"
                    >
                      <ChevronsLeftIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={currentPage === 0}
                      onClick={() => setPageIndex((value) => value - 1)}
                      aria-label="Página anterior"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={currentPage >= pageCount - 1}
                      onClick={() => setPageIndex((value) => value + 1)}
                      aria-label="Página siguiente"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={currentPage >= pageCount - 1}
                      onClick={() => setPageIndex(pageCount - 1)}
                      aria-label="Última página"
                    >
                      <ChevronsRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

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
      <Dialog
        open={Boolean(detailMovement)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-3xl sm:max-w-md">
          {detailMovement ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailMovement.label}</DialogTitle>
                <DialogDescription>
                  {detailMovement.type === 'income' ? 'Ingreso' : 'Gasto'} ·{' '}
                  {formatDate(detailMovement.date)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-3xl font-bold tabular-nums">
                <span className="sr-only">
                  {detailMovement.type === 'income' ? 'Entrada' : 'Salida'}
                  :{' '}
                </span>
                {detailMovement.type === 'income' ? '+' : '−'}
                {formatCurrency(detailMovement.amount, detailMovement.currency)}
              </p>
              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Fecha</dt>
                  <dd className="font-medium">
                    {formatDate(detailMovement.date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">
                    {detailMovement.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Detalle</dt>
                  <dd className="font-medium">{detailMovement.meta}</dd>
                </div>
              </dl>
              {detailMovement.type === 'income' &&
              detailMovement.income.recurringIncomeId ? (
                <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Este movimiento es una ocurrencia recurrente. Las acciones de
                  abajo afectan solamente esta fecha.
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="w-full flex-1"
                  variant="outline"
                  onClick={() => {
                    setDetail(null);
                    if (detailMovement.type === 'expense') {
                      setSelectedExpense(detailMovement.expense);
                      setIsExpenseDialogOpen(true);
                    } else {
                      setSelectedIncome(detailMovement.income);
                    }
                  }}
                >
                  <Pencil className="size-4" />
                  {detailMovement.type === 'income' &&
                  detailMovement.income.recurringIncomeId
                    ? 'Editar esta ocurrencia'
                    : 'Editar'}
                </Button>
                {detailMovement.type === 'income' &&
                detailMovement.income.recurringIncomeId &&
                detailMovement.income.status === 'pending' ? (
                  <Button
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={() => void handleSkipIncome(detailMovement.id)}
                  >
                    Omitir esta ocurrencia
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full text-destructive sm:w-auto"
                  onClick={() =>
                    setDeleteTarget({
                      type: detailMovement.type,
                      id: detailMovement.id,
                      label: detailMovement.label,
                      isRecurringOccurrence:
                        detailMovement.type === 'income' &&
                        Boolean(detailMovement.income.recurringIncomeId),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                  <span>
                    {detailMovement.type === 'income' &&
                    detailMovement.income.recurringIncomeId
                      ? 'Eliminar esta ocurrencia'
                      : 'Eliminar'}
                  </span>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <DestructiveActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget
            ? `Eliminar “${deleteTarget.label}”`
            : 'Eliminar movimiento'
        }
        description={
          deleteTarget?.isRecurringOccurrence
            ? 'Se eliminará solamente esta ocurrencia. La recurrencia de los demás meses continuará. Esta acción no se puede deshacer.'
            : 'Este movimiento se eliminará definitivamente y los totales del mes se recalcularán. Esta acción no se puede deshacer.'
        }
        confirmLabel={
          deleteTarget?.isRecurringOccurrence
            ? 'Eliminar esta ocurrencia'
            : 'Eliminar movimiento'
        }
        isPending={isDeleting}
        onConfirm={() => {
          if (deleteTarget?.type === 'expense') {
            return handleDelete(deleteTarget.id);
          }
          if (deleteTarget?.type === 'income') {
            return handleDeleteIncome(deleteTarget.id);
          }
        }}
      />
      <CreateIncomeSheet
        open={Boolean(selectedIncome)}
        onOpenChange={(open) => {
          if (!open) setSelectedIncome(null);
        }}
        boardId={board._id}
        currency={board.baseCurrency}
        income={selectedIncome}
        onSuccess={() => setSelectedIncome(null)}
      />
    </div>
  );
}
