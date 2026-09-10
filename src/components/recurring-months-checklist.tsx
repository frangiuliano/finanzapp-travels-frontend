import { Check } from 'lucide-react';
import { cn, getCurrentYearMonth, shiftYearMonth } from '@/lib/utils';

interface RecurringMonthsChecklistProps {
  excludedYearMonths: string[];
  onChange: (excludedYearMonths: string[]) => void;
  disabled?: boolean;
}

export function RecurringMonthsChecklist({
  excludedYearMonths,
  onChange,
  disabled = false,
}: RecurringMonthsChecklistProps) {
  const months = Array.from({ length: 12 }, (_, index) =>
    shiftYearMonth(getCurrentYearMonth(), index),
  );
  const includedCount = months.filter(
    (yearMonth) => !excludedYearMonths.includes(yearMonth),
  ).length;

  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('es-AR', {
      month: 'long',
    })
      .format(new Date(year, month - 1, 1))
      .replace('.', '');
  };

  const toggleMonth = (yearMonth: string, included: boolean) => {
    const next = included
      ? excludedYearMonths.filter((value) => value !== yearMonth)
      : [...new Set([...excludedYearMonths, yearMonth])];
    onChange(next.sort());
  };

  const includeAll = () => {
    const visibleMonths = new Set(months);
    onChange(
      excludedYearMonths.filter((yearMonth) => !visibleMonths.has(yearMonth)),
    );
  };

  const excludeAll = () => {
    onChange([...new Set([...excludedYearMonths, ...months])].sort());
  };

  return (
    <div
      className="space-y-3 rounded-2xl border bg-background/50 p-3"
      role="group"
      aria-label="Meses incluidos"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Meses incluidos</p>
          <p className="text-[11px] text-muted-foreground">
            {includedCount} de 12 seleccionados
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-[var(--signal)] hover:bg-muted disabled:opacity-50"
            onClick={includeAll}
            disabled={disabled || includedCount === 12}
          >
            Todos
          </button>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            onClick={excludeAll}
            disabled={disabled || includedCount === 0}
          >
            Ninguno
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((yearMonth) => {
          const included = !excludedYearMonths.includes(yearMonth);
          return (
            <button
              key={yearMonth}
              type="button"
              aria-pressed={included}
              onClick={() => toggleMonth(yearMonth, !included)}
              disabled={disabled}
              className={cn(
                'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-50',
                included
                  ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_12%,transparent)] text-foreground'
                  : 'border-border bg-background text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border',
                  included
                    ? 'border-[var(--signal)] bg-[var(--signal)] text-white'
                    : 'border-muted-foreground/40',
                )}
              >
                {included ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="whitespace-nowrap capitalize">
                {formatMonth(yearMonth)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Elegí en qué meses debe generarse este movimiento recurrente.
      </p>
    </div>
  );
}
