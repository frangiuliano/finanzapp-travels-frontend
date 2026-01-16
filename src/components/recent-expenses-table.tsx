'use client';

import { useState, useEffect } from 'react';
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
import { Expense, ExpenseStatus } from '@/types/expense';
import { expensesService } from '@/services/expensesService';
import { toast } from 'sonner';

const getColumnHeaderText = (column: Column<Expense, unknown>): string => {
  const header = column.columnDef.header;
  if (typeof header === 'string') {
    return header;
  }
  const headerMap: Record<string, string> = {
    description: 'Descripción',
    budget: 'Presupuesto',
    paidBy: 'Pagado por',
    status: 'Estado',
    amount: 'Monto',
    expenseDate: 'Fecha',
  };
  return headerMap[column.id] || column.id;
};

const createColumns = (
  tripId: string,
  onEdit?: (expense: Expense) => void,
  onDelete?: (expenseId: string) => void,
  onRefresh?: () => void,
): ColumnDef<Expense>[] => [
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => (
      <div className="font-medium">{row.original.description}</div>
    ),
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
      } else if (expense.paidByThirdParty) {
        return (
          <div className="text-muted-foreground">
            {expense.paidByThirdParty.name}
            {expense.paidByThirdParty.email && (
              <span className="ml-1 text-xs">
                ({expense.paidByThirdParty.email})
              </span>
            )}
          </div>
        );
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
      const amount = row.original.amount;
      const currency = row.original.currency || DEFAULT_CURRENCY;
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency,
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: 'expenseDate',
    header: () => <div className="w-full text-right">Fecha</div>,
    cell: ({ row }) => {
      const date = new Date(row.original.expenseDate || row.original.createdAt);
      return (
        <div className="text-right text-muted-foreground">
          {date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
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
          {row.original.status === ExpenseStatus.PENDING && (
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await expensesService.settleExpense(row.original._id);
                  toast.success('Gasto marcado como pagado');
                  onRefresh?.();
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
    ),
  },
];

interface RecentExpensesTableProps {
  tripId: string;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function RecentExpensesTable({
  tripId,
  onEdit,
  onDelete,
  refreshTrigger,
  onRefresh,
}: RecentExpensesTableProps) {
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
    pageSize: 10,
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

  const columns = createColumns(tripId, onEdit, onDelete, onRefresh);

  const table = useReactTable({
    data,
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gastos Recientes del Viaje</CardTitle>
            <CardDescription>
              Gastos recientes ordenados por fecha de creación
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <WalletIcon className="mb-4 size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No hay gastos registrados aún
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
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
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                {table.getFilteredSelectedRowModel().rows.length} de{' '}
                {table.getFilteredRowModel().rows.length} fila(s)
                seleccionada(s).
              </div>
              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label
                    htmlFor="rows-per-page"
                    className="text-sm font-medium"
                  >
                    Filas por página
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-20" id="rows-per-page">
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
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
