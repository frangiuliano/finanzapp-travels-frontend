import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ForecastLineItem } from '@/types/forecast';
import { formatCurrency } from '@/lib/utils';
import { formatDaysOfMonth } from '@/lib/format-days-of-month';
import { incomesService } from '@/services/incomesService';
import { expensesService } from '@/services/expensesService';

interface BoardForecastSectionProps {
  incomes: ForecastLineItem[];
  fixedExpenses: ForecastLineItem[];
  installments: ForecastLineItem[];
  currency: string;
  isFutureMonth: boolean;
  onRefresh?: () => void;
}

function statusLabel(status?: ForecastLineItem['status']) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'confirmed') return 'Cobrado';
  if (status === 'paid') return 'Pagado';
  return null;
}

function ForecastList({
  title,
  items,
  currency,
  amountClassName,
  onRefresh,
}: {
  title: string;
  items: ForecastLineItem[];
  currency: string;
  amountClassName?: string;
  onRefresh?: () => void;
}) {
  if (items.length === 0) return null;

  const handleConfirmIncome = async (id: string) => {
    try {
      await incomesService.confirmIncome(id);
      toast.success('Ingreso marcado como cobrado');
      onRefresh?.();
    } catch {
      toast.error('No se pudo confirmar el ingreso');
    }
  };

  const handleSettleExpense = async (id: string) => {
    try {
      await expensesService.settleExpense(id);
      toast.success('Gasto marcado como pagado');
      onRefresh?.();
    } catch {
      toast.error('No se pudo marcar el gasto como pagado');
    }
  };

  const handleSkipIncome = async (id: string) => {
    try {
      await incomesService.skipIncome(id);
      toast.success('Ingreso omitido este mes');
      onRefresh?.();
    } catch {
      toast.error('No se pudo omitir el ingreso');
    }
  };

  const handleSkipExpense = async (id: string) => {
    try {
      await expensesService.skipRecurringExpense(id);
      toast.success('Gasto omitido este mes');
      onRefresh?.();
    } catch {
      toast.error('No se pudo omitir el gasto');
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="divide-y rounded-xl border">
        {items.map((item) => {
          const status = statusLabel(item.status);

          return (
            <li
              key={item.id}
              className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  {status ? (
                    <Badge
                      variant={
                        item.status === 'pending' ? 'secondary' : 'outline'
                      }
                    >
                      {status}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.kind === 'recurring-income' && item.meta?.daysOfMonth
                    ? formatDaysOfMonth(item.meta.daysOfMonth)
                    : `Día ${item.dayOfMonth}`}
                  {item.meta?.installmentNumber
                    ? ` · Cuota ${item.meta.installmentNumber}/${item.meta.totalInstallments}`
                    : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`text-sm font-medium tabular-nums ${amountClassName ?? ''}`}
                >
                  {formatCurrency(item.amount, currency)}
                </span>
                {item.status === 'pending' &&
                item.kind === 'recurring-income' ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleConfirmIncome(item.id)}
                    >
                      Cobrado
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSkipIncome(item.id)}
                    >
                      Omitir
                    </Button>
                  </div>
                ) : null}
                {item.status === 'pending' &&
                item.kind === 'recurring-expense' ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSettleExpense(item.id)}
                    >
                      Pagado
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSkipExpense(item.id)}
                    >
                      Omitir
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
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
  onRefresh,
}: BoardForecastSectionProps) {
  const hasItems =
    incomes.length > 0 || fixedExpenses.length > 0 || installments.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compromisos del mes</CardTitle>
          <CardDescription>
            Configurá ingresos recurrentes, gastos fijos y cuotas en{' '}
            <Link
              to="/boards/settings"
              className="text-primary underline-offset-4 hover:underline"
            >
              Config. tablero
            </Link>{' '}
            para ver los movimientos programados.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compromisos del mes</CardTitle>
        <CardDescription>
          {isFutureMonth
            ? 'Movimientos programados para este mes.'
            : 'Ingresos y gastos recurrentes materializados. Confirmalos cuando ocurran.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForecastList
          title="Ingresos recurrentes"
          items={incomes}
          currency={currency}
          amountClassName="text-emerald-700 dark:text-emerald-400"
          onRefresh={onRefresh}
        />
        <ForecastList
          title="Gastos fijos"
          items={fixedExpenses}
          currency={currency}
          amountClassName="text-rose-700 dark:text-rose-400"
          onRefresh={onRefresh}
        />
        <ForecastList
          title="Cuotas de tarjeta"
          items={installments}
          currency={currency}
          amountClassName="text-rose-700 dark:text-rose-400"
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
}
