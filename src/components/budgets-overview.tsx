import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/types/budget';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

interface BudgetsOverviewProps {
  tripName: string;
  budgets: Budget[];
  expenses: Expense[];
}

export function BudgetsOverview({
  tripName,
  budgets,
  expenses,
}: BudgetsOverviewProps) {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (amount: number, budgetCurrency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: budgetCurrency,
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

  const getBudgetSpent = (budgetId: string) => {
    return expenses
      .filter((expense) => expense.budgetId === budgetId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetUsage = (budget: Budget) => {
    const spent = getBudgetSpent(budget._id);
    return budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  };

  const getBudgetExpenses = (budgetId: string) => {
    return expenses
      .filter((expense) => expense.budgetId === budgetId)
      .sort(
        (a, b) =>
          new Date(b.expenseDate || b.createdAt).getTime() -
          new Date(a.expenseDate || a.createdAt).getTime(),
      );
  };

  const handleBudgetClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDialogOpen(true);
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

  if (budgets.length === 0) {
    return null;
  }

  const budgetExpenses = selectedBudget
    ? getBudgetExpenses(selectedBudget._id)
    : [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Presupuestos del viaje</CardTitle>
          <CardDescription>
            Estado de los presupuestos para {tripName}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Gastado</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Progreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.map((budget) => {
              const spent = getBudgetSpent(budget._id);
              const usage = getBudgetUsage(budget);
              const remaining = budget.amount - spent;

              return (
                <TableRow
                  key={budget._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleBudgetClick(budget)}
                >
                  <TableCell className="font-medium">{budget.name}</TableCell>
                  <TableCell>
                    {formatCurrency(budget.amount, budget.currency)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(spent, budget.currency)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(remaining, budget.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={usage} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {usage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gastos del presupuesto: {selectedBudget?.name}
            </DialogTitle>
            <DialogDescription>
              Lista de gastos asociados a este presupuesto
            </DialogDescription>
          </DialogHeader>
          {budgetExpenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay gastos asociados a este presupuesto
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Pagado por</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetExpenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {formatDate(expense.expenseDate || expense.createdAt)}
                      </TableCell>
                      <TableCell>{getParticipantName(expense)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(expense)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === ExpenseStatus.PAID
                              ? 'default'
                              : 'secondary'
                          }
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
    </Card>
  );
}
