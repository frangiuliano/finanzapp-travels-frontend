import { formatDualCurrencyAmount } from '@/lib/expense-currency';
import type { ExpenseCurrencyFields } from '@/lib/expense-currency';
import { cn } from '@/lib/utils';

interface ExpenseAmountDisplayProps {
  expense: ExpenseCurrencyFields;
  boardCurrency: string;
  showBoardCurrency?: boolean;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function ExpenseAmountDisplay({
  expense,
  boardCurrency,
  showBoardCurrency = true,
  className,
  primaryClassName,
  secondaryClassName,
}: ExpenseAmountDisplayProps) {
  const { primary, secondary, fxLabel } = formatDualCurrencyAmount(
    expense,
    boardCurrency,
  );

  if (!showBoardCurrency || !secondary) {
    return (
      <span className={cn('tabular-nums', className, primaryClassName)}>
        {primary}
      </span>
    );
  }

  return (
    <div className={cn('text-right', className)}>
      <div className={cn('font-medium tabular-nums', primaryClassName)}>
        {primary}
      </div>
      <div
        className={cn(
          'text-muted-foreground text-xs tabular-nums',
          secondaryClassName,
        )}
      >
        {secondary}
      </div>
      {fxLabel ? (
        <div className="text-muted-foreground text-[10px]">{fxLabel}</div>
      ) : null}
    </div>
  );
}
