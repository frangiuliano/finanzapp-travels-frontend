import {
  WalletIcon,
  TrendingUpIcon,
  PiggyBankIcon,
  BanknoteIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar-context';
import { Budget } from '@/types/budget';

interface TripDashboardCardsProps {
  tripName: string;
  budgets: Budget[];
  totalExpenses: number;
  totalBudgetedExpenses: number;
  totalUnbudgetedExpenses: number;
  currency: string;
}

export function TripDashboardCards({
  tripName,
  budgets,
  totalExpenses,
  totalBudgetedExpenses,
  totalUnbudgetedExpenses,
  currency,
}: TripDashboardCardsProps) {
  const { state } = useSidebar();

  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    // Usar solo gastos con presupuesto para calcular el uso
    const budgetUsage =
      totalBudget > 0 ? (totalBudgetedExpenses / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalExpenses,
      totalBudgetedExpenses,
      totalUnbudgetedExpenses,
      budgetUsage: Math.min(budgetUsage, 100), // Cap at 100%
      budgetCount: budgets.length,
    };
  }, [budgets, totalExpenses, totalBudgetedExpenses, totalUnbudgetedExpenses]);

  const gridCols =
    state === 'collapsed'
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div
      className={`grid gap-4 ${gridCols} *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card`}
    >
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Buckets</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.budgetCount}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <PiggyBankIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Presupuestos del viaje
          </div>
          <div className="text-muted-foreground">
            Total: {formatCurrency(stats.totalBudget)}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Gastos Totales</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatCurrency(stats.totalExpenses)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <WalletIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total gastado <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">En {tripName}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Uso del Presupuesto</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.budgetUsage.toFixed(1)}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendingUpIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.totalBudget > 0
              ? `${formatCurrency(stats.totalBudget - stats.totalBudgetedExpenses)} restantes`
              : 'Sin presupuesto definido'}
          </div>
          <div className="text-muted-foreground">
            {stats.totalBudget > 0
              ? `de ${formatCurrency(stats.totalBudget)}`
              : 'Agrega buckets para ver el uso'}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Gastos Fuera de Presupuesto</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatCurrency(stats.totalUnbudgetedExpenses)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <BanknoteIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Gastos sin presupuesto asignado
          </div>
          <div className="text-muted-foreground">
            No afectan el uso del presupuesto
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
