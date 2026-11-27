import { Link2 } from 'lucide-react';
import { SortableTableHead } from '@/components/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useColumnSort } from '@/hooks/useColumnSort';
import { formatDate } from '@/lib/utils';
import { formatMoneyInputFromNumber } from '@/lib/money';
import { compareSortValues } from '@/lib/table-sort';
import type { Expense } from '@/types/expense';

type LoadedExpenseSortColumn = 'date' | 'description' | 'amount';

function sortExpenses(
  expenses: Expense[],
  column: LoadedExpenseSortColumn | null,
  direction: 'asc' | 'desc',
): Expense[] {
  if (!column) return expenses;
  const valueFor = (expense: Expense) =>
    column === 'date'
      ? expense.expenseDate
      : column === 'description'
        ? expense.description
        : expense.amount;
  return [...expenses].sort((a, b) =>
    compareSortValues(valueFor(a), valueFor(b), direction),
  );
}

interface StatementImportLoadedExpensesPanelProps {
  expenses: Expense[];
  matchedExpenseIds: Set<string>;
  isLoading?: boolean;
}

export function StatementImportLoadedExpensesPanel({
  expenses,
  matchedExpenseIds,
  isLoading,
}: StatementImportLoadedExpensesPanelProps) {
  const { sortColumn, sortDirection, toggleSort } =
    useColumnSort<LoadedExpenseSortColumn>();
  const sortedExpenses = sortExpenses(expenses, sortColumn, sortDirection);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold">
            Ya cargados en este período ({expenses.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Para comparar y evitar cargar de nuevo lo mismo.
          </p>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : expenses.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No hay gastos cargados en este período todavía.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="date"
                    label="Fecha"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                    className="w-24"
                  />
                  <SortableTableHead
                    column="description"
                    label="Descripción"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                  <SortableTableHead
                    column="amount"
                    label="Monto"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                    className="w-28 text-right"
                    align="right"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="whitespace-nowrap py-3 align-top">
                      {formatDate(expense.expenseDate)}
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex items-center gap-1">
                        <p className="truncate" title={expense.description}>
                          {expense.description}
                        </p>
                        {matchedExpenseIds.has(expense._id) ? (
                          <Tooltip>
                            <TooltipTrigger
                              className="shrink-0 text-amber-600 dark:text-amber-400"
                              aria-label="Coincide con el resumen"
                            >
                              <Link2 className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Coincide con el resumen
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-right align-top">
                      {formatMoneyInputFromNumber(expense.amount)}{' '}
                      <span className="text-xs text-muted-foreground">
                        {expense.currency}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
