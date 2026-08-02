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
};

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    { value, onChange, onBlur, className, placeholder = '0,00', ...props },
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
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn('tabular-nums', className)}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);

MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
