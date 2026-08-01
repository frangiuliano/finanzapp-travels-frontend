import { cn } from '@/lib/utils';

interface DayOfMonthPickerProps {
  mode: 'single' | 'multiple';
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  className?: string;
}

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export function DayOfMonthPicker({
  mode,
  value,
  onChange,
  disabled = false,
  className,
}: DayOfMonthPickerProps) {
  const toggleDay = (day: number) => {
    if (disabled) return;

    if (mode === 'single') {
      onChange([day]);
      return;
    }

    if (value.includes(day)) {
      onChange(value.filter((item) => item !== day));
      return;
    }

    onChange([...value, day].sort((a, b) => a - b));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const selected = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted',
                disabled && 'opacity-50',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      {mode === 'multiple' ? (
        <p className="text-xs text-muted-foreground">
          Podés elegir varios días (ej. sueldo el 1 y aguinaldo el 15).
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Día del mes en que se debita o vence el compromiso.
        </p>
      )}
    </div>
  );
}
