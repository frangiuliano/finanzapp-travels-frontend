import { Link } from 'react-router-dom';
import { PiggyBankIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { BoardMonthBudgetProgress } from '@/types/board-month-budget';
import type { Category } from '@/types/category';
import { formatCurrency } from '@/lib/utils';

interface MonthBudgetsProgressProps {
  progress: BoardMonthBudgetProgress[];
  categories: Category[];
  yearMonth: string;
}

function getCategoryName(categoryId: string, categories: Category[]): string {
  return categories.find((c) => c._id === categoryId)?.name ?? 'Categoría';
}

function getProgressVariant(percentUsed: number): string {
  if (percentUsed >= 100) return '[&>div]:bg-destructive';
  if (percentUsed >= 80) return '[&>div]:bg-amber-500';
  return '';
}

export function MonthBudgetsProgress({
  progress,
  categories,
}: MonthBudgetsProgressProps) {
  if (progress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presupuestos del mes</CardTitle>
          <CardDescription>
            Definí límites por categoría para seguir tu gasto mensual.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <PiggyBankIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Todavía no hay presupuestos para este mes. Configuralos en ajustes
            del tablero cuando estén disponibles.
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/boards/settings">Ir a ajustes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...progress].sort((a, b) => b.percentUsed - a.percentUsed);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Presupuestos del mes</CardTitle>
          <CardDescription>
            Avance por categoría en la moneda del tablero
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/reports">Ver reportes</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {sorted.map((item) => {
          const categoryName = getCategoryName(item.categoryId, categories);
          const cappedPercent = Math.min(item.percentUsed, 100);

          return (
            <div key={item.budgetId} className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium truncate">{categoryName}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {formatCurrency(item.spent, item.currency)} /{' '}
                  {formatCurrency(item.limit, item.currency)}
                </span>
              </div>
              <Progress
                value={cappedPercent}
                className={getProgressVariant(item.percentUsed)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.percentUsed.toFixed(0)}% usado</span>
                <span>
                  {item.remaining >= 0
                    ? `${formatCurrency(item.remaining, item.currency)} restante`
                    : `${formatCurrency(Math.abs(item.remaining), item.currency)} excedido`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
