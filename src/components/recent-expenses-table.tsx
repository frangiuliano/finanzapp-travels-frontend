'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  MoreVerticalIcon,
  WalletIcon,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { expensesService } from '@/services/expensesService';
import { ExpenseAmountDisplay } from '@/components/expense-amount-display';
import {
  expenseBelongsToYearMonth,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';
import type { PaymentMethod as BoardPaymentMethod } from '@/types/payment-method';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

const getColumnHeaderText = (column: Column<Expense, unknown>): string => {
  const header = column.columnDef.header;
  if (typeof header === 'string') {
    return header;
  }
  const headerMap: Record<string, string> = {
    description: 'Descripción',
    budget: 'Presupuesto',
    paidBy: 'Pagado por',
    paymentMethod: 'Método de pago',
    status: 'Estado',
    amount: 'Monto',
    expenseDate: 'Fecha',
  };
  return headerMap[column.id] || column.id;
};

const createColumns = (
  tripId: string,
  boardCurrency: string,
  showBoardCurrency: boolean,
  onEdit?: (expense: Expense) => void,
  onDelete?: (expenseId: string) => void,
  onRefresh?: () => void,
): ColumnDef<Expense>[] => {
  const baseColumns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="min-w-0 font-medium">
            <div>{expense.description}</div>
            {expense.sourceBoardId && expense.sourceBoardId !== tripId ? (
              <Badge
                variant="outline"
                className="mt-1.5 h-auto max-w-full whitespace-normal rounded-md px-2 py-1 text-left font-normal leading-snug"
              >
                Viaje: {expense.sourceBoardName} · Tu parte
              </Badge>
            ) : null}
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: 'budget',
      header: 'Presupuesto',
      cell: ({ row }) => {
        const budget = row.original.budget;
        return (
          <div className="text-muted-foreground">
            {budget?.name || 'Sin presupuesto'}
          </div>
        );
      },
    },
    {
      accessorKey: 'paidBy',
      header: 'Pagado por',
      cell: ({ row }) => {
        const expense = row.original;
        if (expense.paidByParticipant) {
          const participant = expense.paidByParticipant;
          const name =
            participant.guestName ||
            (participant.userId
              ? `${participant.userId.firstName} ${participant.userId.lastName}`
              : 'Usuario');
          return <div className="text-muted-foreground">{name}</div>;
        }
        return <div className="text-muted-foreground">-</div>;
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Método de pago',
      cell: ({ row }) => {
        const expense = row.original;
        if (!expense.paymentMethod) {
          return <div className="text-muted-foreground">-</div>;
        }
        if (expense.paymentMethod === PaymentMethod.CASH) {
          return <div className="text-muted-foreground">Efectivo</div>;
        }
        if (expense.paymentMethod === PaymentMethod.CARD) {
          if (expense.card) {
            const getCardTypeLabel = (type: CardType): string => {
              const labels: Record<CardType, string> = {
                [CardType.VISA]: 'Visa',
                [CardType.MASTERCARD]: 'Mastercard',
                [CardType.AMEX]: 'American Express',
                [CardType.OTHER]: 'Otra',
              };
              return labels[type] || 'Otra';
            };

            return (
              <div className="text-muted-foreground">
                {expense.card.name}
                {expense.card.lastFourDigits && (
                  <span className="ml-1 text-xs">
                    (****{expense.card.lastFourDigits}
                    {expense.card.type &&
                      ` - ${getCardTypeLabel(expense.card.type as CardType)}`}
                    )
                  </span>
                )}
              </div>
            );
          }
          return <div className="text-muted-foreground">Tarjeta</div>;
        }
        return <div className="text-muted-foreground">-</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === ExpenseStatus.PAID ? 'default' : 'secondary'}
          >
            {status === ExpenseStatus.PAID ? 'Pagado' : 'Pendiente'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: () => <div className="w-full text-right">Monto</div>,
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <ExpenseAmountDisplay
            expense={expense}
            boardCurrency={boardCurrency}
            showBoardCurrency={showBoardCurrency}
          />
        );
      },
    },
    {
      accessorKey: 'expenseDate',
      header: () => <div className="w-full text-right">Fecha</div>,
      cell: ({ row }) => (
        <div className="text-left text-muted-foreground md:text-right">
          {formatDate(row.original.expenseDate || row.original.createdAt)}
        </div>
      ),
    },
  ];

  if (onEdit || onDelete) {
    baseColumns.push({
      id: 'actions',
      cell: ({ row }) => {
        if (
          row.original.sourceBoardId &&
          row.original.sourceBoardId !== tripId
        ) {
          return null;
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <MoreVerticalIcon />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {row.original.status === ExpenseStatus.PENDING && onRefresh && (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await expensesService.settleExpense(row.original._id);
                      toast.success('Gasto marcado como pagado');
                      onRefresh();
                    } catch {
                      toast.error('Error al marcar el gasto como pagado');
                    }
                  }}
                >
                  Marcar como pagado
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original._id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return baseColumns;
};

interface RecentExpensesTableProps {
  tripId: string;
  boardCurrency?: string;
  showBoardCurrency?: boolean;
  yearMonth?: string;
  monthView?: HomeMonthView;
  paymentMethodMap?: Map<string, BoardPaymentMethod>;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  refreshTrigger?: number;
  onRefresh?: () => void;
  viewAllHref?: string;
}

export function RecentExpensesTable({
  tripId,
  boardCurrency = DEFAULT_CURRENCY,
  showBoardCurrency = true,
  yearMonth,
  monthView = 'cash_impact',
  paymentMethodMap,
  onEdit,
  onDelete,
  refreshTrigger,
  onRefresh,
  viewAllHref,
}: RecentExpensesTableProps) {
  const [showBoardCurrencyLocal, setShowBoardCurrencyLocal] = useState(() => {
    if (typeof window === 'undefined') return showBoardCurrency;
    const stored = window.localStorage.getItem(
      'finanzapp.showExpenseBoardCurrency',
    );
    return stored == null ? showBoardCurrency : stored === 'true';
  });
  const resolvedShowBoardCurrency =
    showBoardCurrency === false ? false : showBoardCurrencyLocal;

  useEffect(() => {
    window.localStorage.setItem(
      'finanzapp.showExpenseBoardCurrency',
      String(showBoardCurrencyLocal),
    );
  }, [showBoardCurrencyLocal]);

  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'expenseDate', desc: true },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!tripId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await expensesService.getExpenses(tripId);
        const expenses = response.expenses.sort(
          (a, b) =>
            new Date(b.expenseDate || b.createdAt).getTime() -
            new Date(a.expenseDate || a.createdAt).getTime(),
        );
        setData(expenses);
      } catch (error) {
        console.error('Error al cargar gastos recientes:', error);
        toast.error('Error al cargar los gastos');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [tripId, refreshTrigger]);

  const filteredData = useMemo(() => {
    if (!yearMonth || !paymentMethodMap) {
      return data;
    }

    return data.filter((expense) =>
      expenseBelongsToYearMonth(
        expense,
        yearMonth,
        monthView,
        paymentMethodMap,
      ),
    );
  }, [data, yearMonth, monthView, paymentMethodMap]);

  const columns = useMemo(
    () =>
      createColumns(
        tripId,
        boardCurrency,
        resolvedShowBoardCurrency,
        onEdit,
        onDelete,
        onRefresh,
      ),
    [
      tripId,
      boardCurrency,
      resolvedShowBoardCurrency,
      onEdit,
      onDelete,
      onRefresh,
    ],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    // Prevent infinite reset loops when filteredData identity changes.
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>
              {yearMonth ? 'Gastos del mes' : 'Gastos recientes'}
            </CardTitle>
            <CardDescription>
              {yearMonth
                ? monthView === 'cash_impact'
                  ? `Gastos que impactan en ${yearMonth} (incluye tarjeta por ciclo de cierre)`
                  : `Gastos con fecha de compra en ${yearMonth}`
                : 'Gastos recientes ordenados por fecha de creación'}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            {viewAllHref ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Link to={viewAllHref}>Ver todos</Link>
              </Button>
            ) : null}
            <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <Checkbox
                checked={resolvedShowBoardCurrency}
                onCheckedChange={(checked) =>
                  setShowBoardCurrencyLocal(checked === true)
                }
              />
              Ver equivalente en {boardCurrency}
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ColumnsIcon />
                  <span className="hidden lg:inline">Columnas</span>
                  <span className="lg:hidden">Col</span>
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide(),
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {getColumnHeaderText(column)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center gap-3 py-2 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <WalletIcon className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {yearMonth
                ? 'No hay gastos para este mes con la vista seleccionada'
                : 'No hay gastos registrados aún'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border md:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                      >
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
            <div className="space-y-3 md:hidden">
              {table.getRowModel().rows.map((row) => {
                const cells = Object.fromEntries(
                  row.getVisibleCells().map((cell) => [cell.column.id, cell]),
                );
                const detailCells = row
                  .getVisibleCells()
                  .filter((cell) =>
                    ['budget', 'paidBy', 'paymentMethod'].includes(
                      cell.column.id,
                    ),
                  );

                return (
                  <article
                    key={row.id}
                    className="rounded-xl border bg-card p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {cells.description
                          ? flexRender(
                              cells.description.column.columnDef.cell,
                              cells.description.getContext(),
                            )
                          : null}
                      </div>
                      {cells.actions ? (
                        <div className="-mr-2 -mt-2 shrink-0">
                          {flexRender(
                            cells.actions.column.columnDef.cell,
                            cells.actions.getContext(),
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3 border-b pb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha
                        </div>
                        <div className="mt-1 text-sm">
                          {cells.expenseDate
                            ? flexRender(
                                cells.expenseDate.column.columnDef.cell,
                                cells.expenseDate.getContext(),
                              )
                            : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Monto
                        </div>
                        <div className="mt-1 font-semibold">
                          {cells.amount
                            ? flexRender(
                                cells.amount.column.columnDef.cell,
                                cells.amount.getContext(),
                              )
                            : null}
                        </div>
                      </div>
                    </div>

                    {detailCells.length ? (
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                        {detailCells.map((cell) => (
                          <div
                            key={cell.id}
                            className={
                              cell.column.id === 'paymentMethod'
                                ? 'col-span-2'
                                : undefined
                            }
                          >
                            <dt className="text-xs text-muted-foreground">
                              {getColumnHeaderText(cell.column)}
                            </dt>
                            <dd className="mt-1 break-words text-sm">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}

                    {cells.status ? (
                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          Estado
                        </span>
                        {flexRender(
                          cells.status.column.columnDef.cell,
                          cells.status.getContext(),
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 sm:px-4">
              <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                {table.getFilteredSelectedRowModel().rows.length} de{' '}
                {table.getFilteredRowModel().rows.length} fila(s)
                seleccionada(s).
              </div>
              <div className="flex w-full items-center justify-between gap-3 lg:w-fit lg:gap-8">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="rows-per-page"
                    className="hidden text-xs font-medium sm:inline sm:text-sm"
                  >
                    Filas por página
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-16 sm:w-20" id="rows-per-page">
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
                <div className="flex w-fit items-center justify-center whitespace-nowrap text-sm font-medium">
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
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
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
  );
}
