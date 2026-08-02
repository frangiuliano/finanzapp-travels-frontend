import type { ExpenseSimulationResult } from '@/types/expense-simulation';
import { formatCurrency, formatYearMonth } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangleIcon, TrendingDownIcon } from 'lucide-react';

interface ExpenseSimulationResultsProps {
  simulation: ExpenseSimulationResult;
}

export function ExpenseSimulationResults({
  simulation,
}: ExpenseSimulationResultsProps) {
  const { currency, months, summary, label } = simulation;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold">Resultado</h3>
        <p className="text-sm text-muted-foreground">
          Impacto proyectado de &ldquo;{label}&rdquo; sin registrar el gasto.
        </p>
      </div>

      {summary.goesNegative ? (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              El mes más ajustado quedaría en negativo
            </p>
            <p className="mt-1 text-muted-foreground">
              {formatYearMonth(summary.tightestYearMonth)}:{' '}
              {formatCurrency(summary.lowestProjectedRemaining, currency)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
          <TrendingDownIcon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium">Dentro de tu proyección actual</p>
            <p className="mt-1 text-muted-foreground">
              Mes más ajustado: {formatYearMonth(summary.tightestYearMonth)} (
              {formatCurrency(summary.lowestProjectedRemaining, currency)})
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {months.map((month) => (
          <Card key={month.yearMonth} className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">
                {formatYearMonth(month.yearMonth)}
              </CardTitle>
              <CardDescription>
                Cuota {month.installmentNumber} de {simulation.installments}
                {month.isFutureMonth ? ' · Proyección futura' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Cuota simulada</p>
                <p className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  −{formatCurrency(month.simulatedExpense, currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Restante sin compra</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(month.baselineRemaining, currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Restante con compra</p>
                <p
                  className={`font-semibold tabular-nums ${
                    month.projectedRemaining < 0 ? 'text-destructive' : ''
                  }`}
                >
                  {formatCurrency(month.projectedRemaining, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
