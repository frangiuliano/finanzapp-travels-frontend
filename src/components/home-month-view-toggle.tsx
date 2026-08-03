import { CalendarDays, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  getHomeMonthViewLabel,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';
import { cn } from '@/lib/utils';

interface HomeMonthViewToggleProps {
  value: HomeMonthView;
  onChange: (value: HomeMonthView) => void;
}

const OPTIONS: Array<{
  value: HomeMonthView;
  label: string;
  icon: typeof Wallet;
}> = [
  { value: 'cash_impact', label: 'Impacto en bolsillo', icon: Wallet },
  { value: 'calendar', label: 'Mes calendario', icon: CalendarDays },
];

export function HomeMonthViewToggle({
  value,
  onChange,
}: HomeMonthViewToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Cómo contar los gastos del mes
      </Label>
      <div
        className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1"
        role="group"
        aria-label="Cómo contar los gastos del mes"
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-2 py-2 text-xs transition-all sm:text-sm',
                isActive
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="mr-1.5 size-3.5 shrink-0" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value === 'cash_impact'
          ? 'Los consumos con tarjeta de crédito se suman al mes en que los pagás (ciclo de cierre).'
          : 'Los gastos se agrupan por fecha de compra, aunque la tarjeta cierre en otro mes.'}{' '}
        Vista activa: {getHomeMonthViewLabel(value)}.
      </p>
    </div>
  );
}
