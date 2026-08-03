import { CalendarDays, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getHomeMonthViewLabel,
  type HomeMonthView,
} from '@/lib/expense-month-attribution';

interface HomeMonthViewToggleProps {
  value: HomeMonthView;
  onChange: (value: HomeMonthView) => void;
}

export function HomeMonthViewToggle({
  value,
  onChange,
}: HomeMonthViewToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Cómo contar los gastos del mes
      </Label>
      <Tabs
        value={value}
        onValueChange={(next) => onChange(next as HomeMonthView)}
      >
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
          <TabsTrigger
            value="cash_impact"
            className="rounded-lg px-2 py-2 text-xs sm:text-sm"
          >
            <Wallet className="mr-1.5 size-3.5 shrink-0" />
            Impacto en bolsillo
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-lg px-2 py-2 text-xs sm:text-sm"
          >
            <CalendarDays className="mr-1.5 size-3.5 shrink-0" />
            Mes calendario
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        {value === 'cash_impact'
          ? 'Los consumos con tarjeta de crédito se suman al mes en que los pagás (ciclo de cierre).'
          : 'Los gastos se agrupan por fecha de compra, aunque la tarjeta cierre en otro mes.'}{' '}
        Vista activa: {getHomeMonthViewLabel(value)}.
      </p>
    </div>
  );
}
