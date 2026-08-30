import { useState, useEffect, useCallback, useMemo } from 'react';
import { EXPENSES_CHANGED_EVENT } from '@/lib/expense-events';
import { requestConfirmation } from '@/lib/confirmation-events';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Budget } from '@/types/budget';
import { Participant } from '@/types/participant';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { ExpenseFormDialog } from './expense-form-dialog';
import type { Board } from '@/types/board';
import { expensesService } from '@/services/expensesService';
import { toast } from 'sonner';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { formatDate } from '@/lib/utils';

interface TripExpensesSectionProps {
  board: Board;
  budgets: Budget[];
  participants: Participant[];
  onExpensesChange?: () => void;
}

export function TripExpensesSection({
  board,
  budgets,
  participants,
  onExpensesChange,
}: TripExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'expenseDate', desc: true },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const fetchExpenses = useCallback(async () => {
    if (!board._id) return;

    try {
      setIsLoading(true);
      const response = await expensesService.getExpenses(board._id);
      const sortedExpenses = response.expenses.sort(
        (a, b) =>
          new Date(b.expenseDate || b.createdAt).getTime() -
          new Date(a.expenseDate || a.createdAt).getTime(),
      );
      setExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      toast.error('Error al cargar los gastos');
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [board._id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshTrigger]);

  useEffect(() => {
    const onExpensesChanged = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
    return () =>
      window.removeEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getParticipantName = (participant?: {
    _id: string;
    userId?: { firstName: string; lastName: string };
    guestName?: string;
  }): string => {
    if (!participant) return '-';
    if (participant.guestName) return participant.guestName;
    if (participant.userId) {
      return `${participant.userId.firstName} ${participant.userId.lastName}`;
    }
    return 'Usuario';
  };

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (
      !(await requestConfirmation({
        title: '¿Eliminar gasto?',
        description: `Se eliminará “${expense.description}” y se actualizarán los totales del viaje. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar gasto',
      }))
    ) {
      return;
    }

    try {
      await expensesService.deleteExpense(expense._id);
      toast.success('Gasto eliminado exitosamente');
      setRefreshTrigger((prev) => prev + 1);
      onExpensesChange?.();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleExpenseSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    onExpensesChange?.();
    setIsExpenseDialogOpen(false);
    setSelectedExpense(null);
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const getCardTypeLabel = (type: CardType): string => {
    const labels: Record<CardType, string> = {
      [CardType.VISA]: 'Visa',
      [CardType.MASTERCARD]: 'Mastercard',
      [CardType.AMEX]: 'American Express',
      [CardType.OTHER]: 'Otra',
    };
    return labels[type] || 'Otra';
  };

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Descripción',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.description}
            {row.original.merchantName && (
              <div className="text-sm text-muted-foreground">
                {row.original.merchantName}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'budget',
        header: 'Presupuesto',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.budget?.name || 'Sin presupuesto'}
          </div>
        ),
      },
      {
        accessorKey: 'paidBy',
        header: 'Pagado por',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.paidByParticipant
              ? getParticipantName(row.original.paidByParticipant)
              : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Método de pago',
        cell: ({ row }) => {
          const expense = row.original;
          if (!expense.paymentMethod) {
            return <span className="text-muted-foreground">-</span>;
          }
          if (expense.paymentMethod === PaymentMethod.CASH) {
            return <span className="text-muted-foreground">Efectivo</span>;
          }
          if (expense.paymentMethod === PaymentMethod.CARD) {
            if (expense.card) {
              return (
                <span className="text-muted-foreground">
                  {expense.card.name}
                  {expense.card.lastFourDigits && (
                    <span className="ml-1 text-xs">
                      (****{expense.card.lastFourDigits}
                      {expense.card.type &&
                        ` - ${getCardTypeLabel(expense.card.type as CardType)}`}
                      )
                    </span>
                  )}
                </span>
              );
            }
            return <span className="text-muted-foreground">Tarjeta</span>;
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === ExpenseStatus.PAID
                ? 'default'
                : 'secondary'
            }
          >
            {row.original.status === ExpenseStatus.PAID
              ? 'Pagado'
              : 'Pendiente'}
          </Badge>
        ),
      },
      {
        accessorKey: 'expenseDate',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.expenseDate || row.original.createdAt)}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right">Monto</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrency(
              row.original.amount,
              row.original.currency || DEFAULT_CURRENCY,
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditExpense(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteExpense(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [board._id],
  );

  const table = useReactTable({
    data: expenses,
    columns,
    state: {
      sorting,
      pagination,
    },
    getRowId: (row) => row._id,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gastos del viaje</CardTitle>
              <CardDescription>
                {expenses.length > 0
                  ? `${expenses.length} gasto${expenses.length !== 1 ? 's' : ''} • Total: ${formatCurrency(totalExpenses, DEFAULT_CURRENCY)}`
                  : `Gastos registrados para ${board.name}`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateExpense}
              className="w-full sm:w-auto"
              disabled={participants.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Necesitas tener al menos un participante antes de registrar
                gastos
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Cargando gastos...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay gastos registrados para este viaje
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateExpense}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar tu primer gasto
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {expenses.map((expense) => {
                  const paymentLabel =
                    expense.paymentMethod === PaymentMethod.CASH
                      ? 'Efectivo'
                      : expense.card?.name || 'Tarjeta';

                  return (
                    <article
                      key={expense._id}
                      className="rounded-xl border bg-card p-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">
                            {expense.description}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(
                              expense.expenseDate || expense.createdAt,
                            )}{' '}
                            · {expense.budget?.name || 'Sin presupuesto'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <strong className="block tabular-nums">
                            {formatCurrency(
                              expense.amount,
                              expense.currency || DEFAULT_CURRENCY,
                            )}
                          </strong>
                          <Badge
                            variant={
                              expense.status === ExpenseStatus.PAID
                                ? 'default'
                                : 'secondary'
                            }
                            className="mt-1"
                          >
                            {expense.status === ExpenseStatus.PAID
                              ? 'Pagado'
                              : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Pagado por</dt>
                          <dd className="mt-0.5 truncate font-medium">
                            {getParticipantName(expense.paidByParticipant)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Medio</dt>
                          <dd className="mt-0.5 truncate font-medium">
                            {paymentLabel}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          onClick={() => handleEditExpense(expense)}
                          aria-label={`Editar ${expense.description}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          onClick={() => void handleDeleteExpense(expense)}
                          aria-label={`Eliminar ${expense.description}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No hay resultados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="hidden items-center justify-between px-4 pt-4 md:flex">
                <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                  {table.getFilteredRowModel().rows.length} gasto(s) en total
                </div>
                <div className="flex w-full items-center gap-4 lg:gap-8 lg:w-fit">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="rows-per-page"
                      className="text-xs sm:text-sm font-medium hidden sm:inline"
                    >
                      Filas por página
                    </Label>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger
                        className="w-16 sm:w-20"
                        id="rows-per-page"
                      >
                        <SelectValue
                          placeholder={table.getState().pagination.pageSize}
                        />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex w-fit items-center justify-center text-sm font-medium">
                    Página {table.getState().pagination.pageIndex + 1} de{' '}
                    {table.getPageCount()}
                  </div>
                  <div className="ml-auto flex items-center gap-2 lg:ml-0">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Ir a la primera página</span>
                      <ChevronsLeftIcon />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Ir a la página anterior</span>
                      <ChevronLeftIcon />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Ir a la página siguiente</span>
                      <ChevronRightIcon />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden size-8 lg:flex"
                      size="icon"
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Ir a la última página</span>
                      <ChevronsRightIcon />
                    </Button>
                  </div>
                </div>
              </div>
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
        budgets={budgets}
        participants={participants}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </>
  );
}
