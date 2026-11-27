import {
  WalletIcon,
  TrendingUpIcon,
  PiggyBankIcon,
  BanknoteIcon,
  PlusIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Card,
  CardDescription,
  CardContent,
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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Budget } from '@/types/budget';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { formatDate } from '@/lib/utils';
import { CreateBudgetDialog } from '@/components/create-budget-dialog';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import type { Board } from '@/types/board';

interface TripDashboardCardsProps {
  tripId: string;
  tripName: string;
  budgets: Budget[];
  budgetsStatus: 'loading' | 'success' | 'error';
  totalExpenses: number;
  totalBudgetedExpenses: number;
  totalUnbudgetedExpenses: number;
  currency: string;
  expenses: Expense[];
  onBudgetsChange: () => void;
  board: Board;
  budgetOnly?: boolean;
}

export function TripDashboardCards({
  tripId,
  tripName,
  budgets,
  budgetsStatus,
  totalExpenses,
  totalBudgetedExpenses,
  totalUnbudgetedExpenses,
  currency,
  expenses,
  onBudgetsChange,
  board,
  budgetOnly = false,
}: TripDashboardCardsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    // Usar solo gastos con presupuesto para calcular el uso
    const budgetUsage =
      totalBudget > 0 ? (totalBudgetedExpenses / totalBudget) * 100 : null;

    return {
      totalBudget,
      totalExpenses,
      totalBudgetedExpenses,
      totalUnbudgetedExpenses,
      budgetUsage,
      budgetCount: budgets.length,
    };
  }, [budgets, totalExpenses, totalBudgetedExpenses, totalUnbudgetedExpenses]);

  const formatCurrency = (amount: number, expenseCurrency?: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: expenseCurrency || currency,
    }).format(amount);
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
  const hasBudgets = budgetsStatus === 'success' && budgets.length > 0;
  const remaining = stats.totalBudget - stats.totalBudgetedExpenses;
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-4">
      {!budgetOnly && (
        <div className="space-y-3">
          <Card className="bg-linear-to-br from-primary/10 via-card to-card shadow-sm">
            <CardHeader className="relative px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-5">
              <div className="min-w-0 space-y-1.5">
                <CardDescription>Gastos totales</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums sm:text-4xl">
                  {formatCurrency(stats.totalExpenses)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {expenses.length === 0
                    ? 'Todavía no registraste gastos en este viaje.'
                    : `${expenses.length} gasto${expenses.length === 1 ? '' : 's'} registrado${expenses.length === 1 ? '' : 's'} en ${tripName}`}
                </p>
              </div>
              <Button
                className="hidden shrink-0 sm:inline-flex"
                onClick={() => setIsExpenseDialogOpen(true)}
              >
                <PlusIcon className="mr-2 size-4" />
                Registrar gasto
              </Button>
              <WalletIcon className="absolute right-4 top-4 size-6 text-primary/70 sm:hidden" />
            </CardHeader>
          </Card>
          <Button
            size="lg"
            className="h-12 w-full sm:hidden"
            onClick={() => setIsExpenseDialogOpen(true)}
          >
            <PlusIcon className="mr-2 size-5" />
            Registrar gasto
          </Button>
          <ExpenseFormDialog
            open={isExpenseDialogOpen}
            onOpenChange={setIsExpenseDialogOpen}
            board={board}
            budgets={budgets}
            onSuccess={onBudgetsChange}
          />
        </div>
      )}

      {!budgetOnly ? null : (
        <>
          {budgetsStatus === 'loading' && (
            <div
              className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
              aria-label="Cargando presupuesto"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          )}

          {budgetsStatus === 'error' && (
            <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">
                    No pudimos cargar el presupuesto
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tus gastos siguen disponibles. Podés volver a intentar.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onBudgetsChange}>
                <RefreshCwIcon className="mr-2 size-4" />
                Reintentar
              </Button>
            </div>
          )}

          {budgetsStatus === 'success' && !hasBudgets && (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <PiggyBankIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Presupuesto opcional</p>
                  <p className="text-xs text-muted-foreground">
                    Podés definir uno si querés controlar cuánto gastar.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-start sm:self-auto"
                onClick={() => setIsBudgetDialogOpen(true)}
              >
                <PlusIcon className="mr-2 size-4" />
                Agregar
              </Button>
            </div>
          )}

          <div
            className={`grid gap-4 ${hasBudgets ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2'} *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card`}
          >
            {hasBudgets && (
              <Card className="@container/card">
                <CardHeader className="relative">
                  <CardDescription>Presupuesto total</CardDescription>
                  <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                    {formatCurrency(stats.totalBudget)}
                  </CardTitle>
                  <div className="absolute right-4 top-4">
                    <PiggyBankIcon className="size-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                  {stats.budgetCount === 1
                    ? '1 presupuesto configurado'
                    : `${stats.budgetCount} presupuestos configurados`}
                </CardFooter>
              </Card>
            )}

            {hasBudgets && (
              <Card className="@container/card">
                <CardHeader className="relative">
                  <CardDescription>Gastado del presupuesto</CardDescription>
                  <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                    {formatCurrency(stats.totalBudgetedExpenses)}
                  </CardTitle>
                  <div className="absolute right-4 top-4">
                    <TrendingUpIcon className="size-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        isOverBudget
                          ? 'font-medium text-destructive'
                          : 'text-muted-foreground'
                      }
                    >
                      {isOverBudget
                        ? `${formatCurrency(Math.abs(remaining))} por encima`
                        : `${formatCurrency(remaining)} restante`}
                    </span>
                    <span className="font-medium tabular-nums">
                      {stats.budgetUsage === null
                        ? stats.totalBudgetedExpenses > 0
                          ? 'Superado'
                          : '0%'
                        : `${stats.budgetUsage.toFixed(1)}%`}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.budgetUsage === null
                        ? stats.totalBudgetedExpenses > 0
                          ? 100
                          : 0
                        : stats.budgetUsage
                    }
                    aria-label="Progreso del presupuesto"
                  />
                  {stats.totalBudget === 0 && (
                    <p className="text-xs text-muted-foreground">
                      El presupuesto configurado tiene valor 0.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {hasBudgets && (
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
            )}
          </div>
        </>
      )}

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

      <CreateBudgetDialog
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
        tripId={tripId}
        onSuccess={() => {
          setIsBudgetDialogOpen(false);
          onBudgetsChange();
        }}
      />
    </div>
  );
}
