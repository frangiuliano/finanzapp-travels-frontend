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
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { ExpenseAmountDisplay } from '@/components/expense-amount-display';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Badge } from '@/components/ui/badge';
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
  const [pageIndex, setPageIndex] = useState(0);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [detail, setDetail] = useState<{
    type: 'expense' | 'income';
    id: string;
  } | null>(null);
  const expensesChangedRefresh = useExpensesChangedRefresh();

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
  }, [yearMonth, monthView, paymentMethodId, categoryId, status]);

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
      });
    return () => {
      stale = true;
    };
  }, [board._id, yearMonth, expensesChangedRefresh]);

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
              meta: 'Ingreso',
              amount: income.amount,
              currency: income.currency,
              income,
            }))
          : []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, incomes, movementType, paymentMethodNameById],
  );

  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(expenses.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageExpenses = expenses.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  const totals = useMemo(() => {
    let totalInBoard = 0;
    let excluded = 0;

    for (const expense of expenses) {
      const amount = getExpenseAmountInBoardCurrency(
        expense,
        board.baseCurrency,
      );
      if (amount == null) {
        excluded += 1;
        continue;
      }
      totalInBoard += amount;
    }

    return {
      count: expenses.length,
      totalInBoard,
      excluded,
    };
  }, [expenses, board.baseCurrency]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }

    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('Gasto eliminado');
      setExpenses((current) =>
        current.filter((item) => item._id !== expenseId),
      );
    } catch {
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ingreso?')) return;
    try {
      await incomesService.deleteIncome(incomeId);
      setIncomes((current) => current.filter((item) => item._id !== incomeId));
      setDetail(null);
      toast.success('Ingreso eliminado');
    } catch {
      toast.error('No se pudo eliminar el ingreso');
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
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl sm:hidden"
          onClick={() => setShowFilters((value) => !value)}
          aria-label="Mostrar filtros"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      <Card className={showFilters ? '' : 'hidden sm:block'}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>
            Medio de pago, categoría y estado para los gastos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="expense-filter-payment">Medio de pago</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger id="expense-filter-payment" className="rounded-xl">
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
                <SelectItem value={ALL_FILTER}>Todas las categorías</SelectItem>
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
              <SelectTrigger id="expense-filter-status" className="rounded-xl">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Todos</SelectItem>
                <SelectItem value={ExpenseStatus.PAID}>Pagado</SelectItem>
                <SelectItem value={ExpenseStatus.PENDING}>Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Movimientos encontrados</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? '—' : movements.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total en {board.baseCurrency}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading
                ? '—'
                : formatCurrency(totals.totalInBoard, board.baseCurrency)}
            </CardTitle>
          </CardHeader>
          {!isLoading && totals.excluded > 0 ? (
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {totals.excluded} gasto
              {totals.excluded === 1 ? '' : 's'} sin equivalente en{' '}
              {board.baseCurrency}.
            </CardContent>
          ) : null}
        </Card>
      </div>

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
          {isLoading ? (
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
                {movements.map((movement) => (
                  <li
                    key={`${movement.type}-${movement.id}`}
                    className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl py-3 focus-within:ring-2 focus-within:ring-ring"
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
                      <strong className="block truncate text-sm">
                        {movement.label}
                      </strong>
                      <span className="block truncate text-xs text-muted-foreground">
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
                    {pageExpenses.map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(expense.expenseDate || expense.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] font-medium sm:max-w-xs">
                          <span className="block truncate">
                            {expense.description}
                          </span>
                          {expense.sourceBoardId &&
                          expense.sourceBoardId !== board._id ? (
                            <Badge
                              variant="outline"
                              className="mt-1 max-w-full truncate font-normal"
                            >
                              Viaje: {expense.sourceBoardName} · Tu parte
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {getExpenseCategoryLabel(expense.category) || '—'}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {resolvePaymentMethodLabel(
                            expense,
                            paymentMethodNameById,
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={
                              expense.status === ExpenseStatus.PAID
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {expense.status === ExpenseStatus.PAID
                              ? 'Pagado'
                              : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ExpenseAmountDisplay
                            expense={expense}
                            boardCurrency={board.baseCurrency}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEdit(expense)}
                              disabled={
                                expense.sourceBoardId !== undefined &&
                                expense.sourceBoardId !== board._id
                              }
                              aria-label="Editar gasto"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => void handleDelete(expense._id)}
                              disabled={
                                expense.sourceBoardId !== undefined &&
                                expense.sourceBoardId !== board._id
                              }
                              aria-label="Eliminar gasto"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
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
              <div className="flex gap-2">
                <Button
                  className="flex-1"
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
                  <Pencil className="size-4" /> Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() =>
                    detailMovement.type === 'expense'
                      ? void handleDelete(detailMovement.id)
                      : void handleDeleteIncome(detailMovement.id)
                  }
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only sm:not-sr-only">Eliminar</span>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
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
