import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { CreateExpenseDialog } from './create-expense-dialog';
import { expensesService } from '@/services/expensesService';
import { toast } from 'sonner';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

interface TripExpensesSectionProps {
  tripId: string;
  tripName: string;
  budgets: Budget[];
  participants: Participant[];
  onExpensesChange?: () => void;
}

export function TripExpensesSection({
  tripId,
  tripName,
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
    if (!tripId) return;

    try {
      setIsLoading(true);
      const response = await expensesService.getExpenses(tripId);
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
  }, [tripId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshTrigger]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
      !confirm(
        `¿Estás seguro de que deseas eliminar el gasto "${expense.description}"?`,
      )
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
    [tripId],
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
              <CardTitle>Gastos del Viaje</CardTitle>
              <CardDescription>
                {expenses.length > 0
                  ? `${expenses.length} gasto${expenses.length !== 1 ? 's' : ''} • Total: ${formatCurrency(totalExpenses, DEFAULT_CURRENCY)}`
                  : `Gastos registrados para ${tripName}`}
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
              <div className="overflow-x-auto">
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
              <div className="flex items-center justify-between px-4 pt-4">
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

      <CreateExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={(open) => {
          setIsExpenseDialogOpen(open);
          if (!open) {
            setSelectedExpense(null);
          }
        }}
        tripId={tripId}
        budgets={budgets}
        participants={participants}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </>
  );
}
