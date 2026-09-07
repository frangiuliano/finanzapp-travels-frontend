import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { formatMoneyInputFromNumber } from '@/lib/money';
import type { Expense } from '@/types/expense';

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
  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-semibold">
          Ya cargados en este período ({expenses.length})
        </h4>
        <p className="text-xs text-muted-foreground">
          Gastos de esta tarjeta ya registrados en el rango de fechas del
          resumen — para reconciliar a mano lo que el detector automático no
          haya podido matchear.
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
                <TableHead className="w-24">Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-28 text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell className="whitespace-nowrap py-3 align-top">
                    {formatDate(expense.expenseDate)}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <p className="truncate" title={expense.description}>
                      {expense.description}
                    </p>
                    {matchedExpenseIds.has(expense._id) ? (
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        Coincide con el resumen
                      </Badge>
                    ) : null}
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
  );
}
