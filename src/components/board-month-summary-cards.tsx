import { StatStrip } from '@/components/stat-strip';
import type { MonthlyBoardSummary } from '@/types/income';
import { formatYearMonth } from '@/lib/utils';

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
      <StatStrip
        centered
        items={[
          { label: 'Ingresos', value: totalIncomes, currency },
          { label: 'Gastos', value: totalExpenses, currency },
          {
            label: 'Restante',
            value: remaining,
            currency,
            negative: remaining < 0,
          },
        ]}
      />

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
