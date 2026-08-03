import type { HomeMonthView } from '@/lib/expense-month-attribution';
import { shiftYearMonth } from '@/lib/utils';

function getLastDayOfYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
}

export function getExpenseQueryDateRange(
  yearMonth: string,
  monthView: HomeMonthView,
): { from: string; to: string } {
  if (monthView === 'calendar') {
    return {
      from: `${yearMonth}-01`,
      to: getLastDayOfYearMonth(yearMonth),
    };
  }

  const previousMonth = shiftYearMonth(yearMonth, -1);
  const nextMonth = shiftYearMonth(yearMonth, 1);

  return {
    from: `${previousMonth}-01`,
    to: getLastDayOfYearMonth(nextMonth),
  };
}
