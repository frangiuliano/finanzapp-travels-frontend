import { StatStrip, type StatStripItem } from '@/components/stat-strip';
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

  const items: StatStripItem[] = [
    { label: 'Ingresos', value: totalIncomes, currency },
    { label: 'Gastos', value: totalExpenses, currency },
    {
      label: 'Restante',
      value: remaining,
      currency,
      negative: remaining < 0,
    },
    ...summary.incomesByCurrency.map((entry) => ({
      label: `Ingresos en ${entry.currency}`,
      value: entry.total,
      currency: entry.currency,
    })),
    ...summary.expensesByCurrency.map((entry) => ({
      label: `Gastos en ${entry.currency}`,
      value: entry.total,
      currency: entry.currency,
    })),
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      <StatStrip centered items={items} />
    </div>
  );
}
