import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatYearMonth, shiftYearMonth } from '@/lib/utils';

interface YearMonthSelectorProps {
  yearMonth: string;
  onChange: (yearMonth: string) => void;
}

export function YearMonthSelector({
  yearMonth,
  onChange,
}: YearMonthSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-2 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-lg"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftYearMonth(yearMonth, -1))}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <p className="min-w-0 flex-1 text-center text-sm font-medium capitalize">
        {formatYearMonth(yearMonth)}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-lg"
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftYearMonth(yearMonth, 1))}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
}
