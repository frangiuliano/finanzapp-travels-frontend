import { WalletIcon } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatStrip } from '@/components/stat-strip';
import type { MonthlyForecast } from '@/types/forecast';
import type { HomeMonthView } from '@/lib/expense-month-attribution';
import { formatCurrency, formatYearMonth } from '@/lib/utils';

interface MonthlyPlanningCardsProps {
  forecast: MonthlyForecast;
  monthView: HomeMonthView;
}

export function MonthlyPlanningCards({
  forecast,
  monthView,
}: MonthlyPlanningCardsProps) {
  const { currency, yearMonth, isFutureMonth, actual, planned } = forecast;
  const monthLabel = formatYearMonth(yearMonth);

  const incomeTotal = isFutureMonth
    ? planned.totalIncomes
    : actual.totalIncomes;
  const expenseTotal = isFutureMonth
    ? planned.totalOutflows
    : actual.totalExpenses;
  const remaining = planned.projectedRemaining;
  const expenseHint =
    monthView === 'cash_impact'
      ? 'Gastos que impactan en tu bolsillo este mes'
      : 'Gastos por fecha de compra';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      {isFutureMonth ? (
        <p className="text-xs text-muted-foreground">
          Proyección según ingresos recurrentes, gastos fijos y cuotas
          pendientes.
        </p>
      ) : null}

      <StatStrip
        centered
        items={[
          {
            label: isFutureMonth ? 'Ingresos planificados' : 'Ingresos',
            value: incomeTotal,
            currency,
            description: isFutureMonth
              ? 'Recurrentes del mes'
              : `Plan: ${formatCurrency(planned.totalIncomes, currency)}`,
          },
          {
            label: isFutureMonth ? 'Compromisos' : 'Gastos',
            value: expenseTotal,
            currency,
            description: isFutureMonth
              ? 'Fijos + cuotas'
              : `Fijos/cuotas: ${formatCurrency(planned.totalOutflows, currency)}`,
          },
        ]}
      />
      <div>
        <Card className="@container/card">
          <CardHeader className="text-center">
            <CardDescription className="flex items-center justify-center gap-2">
              <WalletIcon className="size-4 shrink-0" aria-hidden />
              Restante proyectado
            </CardDescription>
            <CardTitle
              className={`@[200px]/card:text-3xl text-2xl font-semibold tabular-nums [overflow-wrap:anywhere] ${
                remaining < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(remaining, currency)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="justify-center text-center text-sm text-muted-foreground">
            Ingresos − {expenseHint.toLowerCase()}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
