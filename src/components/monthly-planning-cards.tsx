import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  WalletIcon,
} from 'lucide-react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MonthlyForecast } from '@/types/forecast';
import { formatCurrency, formatYearMonth } from '@/lib/utils';

interface MonthlyPlanningCardsProps {
  forecast: MonthlyForecast;
}

export function MonthlyPlanningCards({ forecast }: MonthlyPlanningCardsProps) {
  const { currency, yearMonth, isFutureMonth, actual, planned } = forecast;
  const monthLabel = formatYearMonth(yearMonth);

  const incomeTotal = isFutureMonth
    ? planned.totalIncomes
    : actual.totalIncomes;
  const expenseTotal = isFutureMonth
    ? planned.totalOutflows
    : actual.totalExpenses;
  const remaining = planned.projectedRemaining;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      {isFutureMonth ? (
        <p className="text-xs text-muted-foreground">
          Proyección según ingresos recurrentes, gastos fijos y cuotas
          pendientes.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>
              {isFutureMonth ? 'Ingresos planificados' : 'Ingresos'}
            </CardDescription>
            <CardTitle className="@[200px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {formatCurrency(incomeTotal, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <ArrowUpCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            {isFutureMonth
              ? 'Recurrentes del mes'
              : `Real: ${formatCurrency(actual.totalIncomes, currency)} · Plan: ${formatCurrency(planned.totalIncomes, currency)}`}
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>
              {isFutureMonth ? 'Compromisos' : 'Gastos'}
            </CardDescription>
            <CardTitle className="@[200px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {formatCurrency(expenseTotal, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <ArrowDownCircleIcon className="size-6 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            {isFutureMonth
              ? 'Fijos + cuotas del mes'
              : `Real: ${formatCurrency(actual.totalExpenses, currency)} · Fijos/cuotas: ${formatCurrency(planned.totalOutflows, currency)}`}
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Restante proyectado</CardDescription>
            <CardTitle
              className={`@[200px]/card:text-3xl text-2xl font-semibold tabular-nums ${
                remaining < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(remaining, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <WalletIcon className="size-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Ingresos − gastos/compromisos del mes
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
