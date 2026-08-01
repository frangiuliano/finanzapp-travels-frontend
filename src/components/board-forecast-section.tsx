import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';
import type { ForecastLineItem } from '@/types/forecast';
import { formatCurrency } from '@/lib/utils';
import { formatDaysOfMonth } from '@/lib/format-days-of-month';

interface BoardForecastSectionProps {
  incomes: ForecastLineItem[];
  fixedExpenses: ForecastLineItem[];
  installments: ForecastLineItem[];
  currency: string;
  isFutureMonth: boolean;
}

function ForecastList({
  title,
  items,
  currency,
  amountClassName,
}: {
  title: string;
  items: ForecastLineItem[];
  currency: string;
  amountClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="divide-y rounded-xl border">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.kind === 'recurring-income' && item.meta?.daysOfMonth
                  ? formatDaysOfMonth(item.meta.daysOfMonth)
                  : `Día ${item.dayOfMonth}`}
                {item.meta?.installmentNumber
                  ? ` · Cuota ${item.meta.installmentNumber}/${item.meta.totalInstallments}`
                  : null}
              </p>
            </div>
            <span
              className={`shrink-0 text-sm font-medium tabular-nums ${amountClassName ?? ''}`}
            >
              {formatCurrency(item.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BoardForecastSection({
  incomes,
  fixedExpenses,
  installments,
  currency,
  isFutureMonth,
}: BoardForecastSectionProps) {
  const hasItems =
    incomes.length > 0 || fixedExpenses.length > 0 || installments.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planificación del mes</CardTitle>
          <CardDescription>
            Configurá ingresos recurrentes, gastos fijos y cuotas en{' '}
            <Link
              to="/boards/settings"
              className="text-primary underline-offset-4 hover:underline"
            >
              Config. tablero
            </Link>{' '}
            para ver proyecciones.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Planificación del mes</CardTitle>
        <CardDescription>
          {isFutureMonth
            ? 'Compromisos proyectados para este mes.'
            : 'Ingresos recurrentes y compromisos que aún no registraste como movimiento.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForecastList
          title="Ingresos recurrentes"
          items={incomes}
          currency={currency}
          amountClassName="text-emerald-700 dark:text-emerald-400"
        />
        <ForecastList
          title="Gastos fijos"
          items={fixedExpenses}
          currency={currency}
          amountClassName="text-rose-700 dark:text-rose-400"
        />
        <ForecastList
          title="Cuotas de tarjeta"
          items={installments}
          currency={currency}
          amountClassName="text-rose-700 dark:text-rose-400"
        />
      </CardContent>
    </Card>
  );
}
