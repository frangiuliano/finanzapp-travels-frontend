import * as React from 'react';

import { cn } from '@/lib/utils';
import { formatMoneyInputString } from '@/lib/money';
import { Input } from '@/components/ui/input';

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'value' | 'onChange'
> & {
  value: string;
  onChange: (value: string) => void;
  /** Currency code shown as a prefix before the amount, e.g. "ARS". */
  currency?: string;
};

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      className,
      placeholder = '0,00',
      currency,
      ...props
    },
    ref,
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(formatMoneyInputString(event.target.value));
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (value) {
        const formattedValue = formatMoneyInputString(value);
        if (formattedValue !== value) {
          onChange(formattedValue);
        }
      }

      onBlur?.(event);
    };

    return (
      <div className="relative">
        {currency ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex select-none items-center text-xs font-medium tracking-wide text-muted-foreground"
          >
            {currency}
          </span>
        ) : null}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={cn('tabular-nums', currency && 'pl-12', className)}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
      </div>
    );
  },
);

MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
