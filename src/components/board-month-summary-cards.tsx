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
import type { MonthlyBoardSummary } from '@/types/income';
import { formatCurrency, formatYearMonth } from '@/lib/utils';

interface BoardMonthSummaryCardsProps {
  summary: MonthlyBoardSummary;
  yearMonth: string;
}

export function BoardMonthSummaryCards({
  summary,
  yearMonth,
}: BoardMonthSummaryCardsProps) {
  const { currency, totalIncomes, totalExpenses, remaining } = summary;
  const monthLabel = formatYearMonth(yearMonth);
  const hasCurrencyMismatch =
    summary.excludedDueToCurrencyMismatch.incomes > 0 ||
    summary.excludedDueToCurrencyMismatch.expenses > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Ingresos</CardDescription>
            <CardTitle className="@[200px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {formatCurrency(totalIncomes, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <ArrowUpCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Total del mes en {currency}
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Gastos</CardDescription>
            <CardTitle className="@[200px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {formatCurrency(totalExpenses, currency)}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <ArrowDownCircleIcon className="size-6 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Gastos del mes calendario
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader className="relative">
            <CardDescription>Restante</CardDescription>
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
            Ingresos − gastos del mes
          </CardFooter>
        </Card>
      </div>

      {hasCurrencyMismatch && (
        <p className="text-xs text-muted-foreground">
          {summary.excludedDueToCurrencyMismatch.incomes > 0 &&
            `${summary.excludedDueToCurrencyMismatch.incomes} ingreso(s)`}
          {summary.excludedDueToCurrencyMismatch.incomes > 0 &&
            summary.excludedDueToCurrencyMismatch.expenses > 0 &&
            ' y '}
          {summary.excludedDueToCurrencyMismatch.expenses > 0 &&
            `${summary.excludedDueToCurrencyMismatch.expenses} gasto(s)`}{' '}
          en otra moneda no se incluyen en el resumen ({currency}).
        </p>
      )}
    </div>
  );
}
