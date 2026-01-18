import {
  WalletIcon,
  TrendingUpIcon,
  PiggyBankIcon,
  BanknoteIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/ui/sidebar-context';
import { Budget } from '@/types/budget';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

interface TripDashboardCardsProps {
  tripName: string;
  budgets: Budget[];
  totalExpenses: number;
  totalBudgetedExpenses: number;
  totalUnbudgetedExpenses: number;
  currency: string;
  expenses: Expense[];
}

export function TripDashboardCards({
  tripName,
  budgets,
  totalExpenses,
  totalBudgetedExpenses,
  totalUnbudgetedExpenses,
  currency,
  expenses,
}: TripDashboardCardsProps) {
  const { state } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const formatCurrency = (amount: number, expenseCurrency?: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: expenseCurrency || currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getUnbudgetedExpenses = () => {
    return expenses
      .filter((expense) => !expense.budgetId)
      .sort(
        (a, b) =>
          new Date(b.expenseDate || b.createdAt).getTime() -
          new Date(a.expenseDate || a.createdAt).getTime(),
      );
  };

  const getParticipantName = (expense: Expense) => {
    if (expense.paidByParticipant) {
      const participant = expense.paidByParticipant;
      return (
        participant.guestName ||
        (participant.userId
          ? `${participant.userId.firstName} ${participant.userId.lastName}`
          : 'Usuario')
      );
    }
    return '-';
  };

  const getPaymentMethodLabel = (expense: Expense) => {
    if (!expense.paymentMethod) return '-';
    if (expense.paymentMethod === PaymentMethod.CASH) return 'Efectivo';
    if (expense.paymentMethod === PaymentMethod.CARD) {
      if (expense.card) {
        const getCardTypeLabel = (type: CardType): string => {
          const labels: Record<CardType, string> = {
            [CardType.VISA]: 'Visa',
            [CardType.MASTERCARD]: 'Mastercard',
            [CardType.AMEX]: 'American Express',
            [CardType.OTHER]: 'Otra',
          };
          return labels[type] || 'Otra';
        };
        return `${expense.card.name}${
          expense.card.lastFourDigits
            ? ` (****${expense.card.lastFourDigits}${
                expense.card.type
                  ? ` - ${getCardTypeLabel(expense.card.type as CardType)}`
                  : ''
              })`
            : ''
        }`;
      }
      return 'Tarjeta';
    }
    return '-';
  };

  const unbudgetedExpenses = getUnbudgetedExpenses();

  return (
    <div
      className={`grid gap-4 ${gridCols} *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card`}
    >
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Presupuestos</CardDescription>
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
              : 'Agrega presupuestos para ver el uso'}
          </div>
        </CardFooter>
      </Card>
      <Card
        className="@container/card cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsDialogOpen(true)}
      >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Gastos fuera del presupuesto
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Lista de gastos que no tienen presupuesto asignado
            </DialogDescription>
          </DialogHeader>
          {unbudgetedExpenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay gastos fuera del presupuesto
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Fecha
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Pagado por
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Método de pago
                    </TableHead>
                    <TableHead className="min-w-[80px]">Estado</TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Monto
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unbudgetedExpenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{expense.description}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatDate(
                              expense.expenseDate || expense.createdAt,
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground md:hidden">
                            {getParticipantName(expense)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(expense.expenseDate || expense.createdAt)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getParticipantName(expense)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs">
                          {getPaymentMethodLabel(expense)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === ExpenseStatus.PAID
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {expense.status === ExpenseStatus.PAID
                            ? 'Pagado'
                            : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          expense.amount,
                          expense.currency || DEFAULT_CURRENCY,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
