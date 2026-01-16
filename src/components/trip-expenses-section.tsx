import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/types/budget';
import { Participant } from '@/types/participant';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types/expense';
import { CardType } from '@/types/card';
import { CreateExpenseDialog } from './create-expense-dialog';
import { expensesService } from '@/services/expensesService';
import { toast } from 'sonner';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

interface TripExpensesSectionProps {
  tripId: string;
  tripName: string;
  budgets: Budget[];
  participants: Participant[];
  onExpensesChange?: () => void;
}

export function TripExpensesSection({
  tripId,
  tripName,
  budgets,
  participants,
  onExpensesChange,
}: TripExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchExpenses = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      const response = await expensesService.getExpenses(tripId);
      const sortedExpenses = response.expenses.sort(
        (a, b) =>
          new Date(b.expenseDate || b.createdAt).getTime() -
          new Date(a.expenseDate || a.createdAt).getTime(),
      );
      setExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      toast.error('Error al cargar los gastos');
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshTrigger]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
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

  const getParticipantName = (participant?: {
    _id: string;
    userId?: { firstName: string; lastName: string };
    guestName?: string;
  }): string => {
    if (!participant) return '-';
    if (participant.guestName) return participant.guestName;
    if (participant.userId) {
      return `${participant.userId.firstName} ${participant.userId.lastName}`;
    }
    return 'Usuario';
  };

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el gasto "${expense.description}"?`,
      )
    ) {
      return;
    }

    try {
      await expensesService.deleteExpense(expense._id);
      toast.success('Gasto eliminado exitosamente');
      setRefreshTrigger((prev) => prev + 1);
      onExpensesChange?.();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleExpenseSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    onExpensesChange?.();
    setIsExpenseDialogOpen(false);
    setSelectedExpense(null);
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gastos del Viaje</CardTitle>
              <CardDescription>
                {expenses.length > 0
                  ? `${expenses.length} gasto${expenses.length !== 1 ? 's' : ''} • Total: ${formatCurrency(totalExpenses, DEFAULT_CURRENCY)}`
                  : `Gastos registrados para ${tripName}`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateExpense}
              className="w-full sm:w-auto"
              disabled={participants.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Necesitas tener al menos un participante antes de registrar
                gastos
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Cargando gastos...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay gastos registrados para este viaje
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateExpense}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar tu primer gasto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Pagado por</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        {expense.description}
                        {expense.merchantName && (
                          <div className="text-sm text-muted-foreground">
                            {expense.merchantName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {expense.budget?.name || 'Sin presupuesto'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {expense.paidByParticipant
                            ? getParticipantName(expense.paidByParticipant)
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {!expense.paymentMethod ? (
                            <span className="text-muted-foreground">-</span>
                          ) : expense.paymentMethod === PaymentMethod.CASH ? (
                            <span className="text-muted-foreground">
                              Efectivo
                            </span>
                          ) : expense.paymentMethod === PaymentMethod.CARD ? (
                            expense.card ? (
                              (() => {
                                const getCardTypeLabel = (
                                  type: CardType,
                                ): string => {
                                  const labels: Record<CardType, string> = {
                                    [CardType.VISA]: 'Visa',
                                    [CardType.MASTERCARD]: 'Mastercard',
                                    [CardType.AMEX]: 'American Express',
                                    [CardType.OTHER]: 'Otra',
                                  };
                                  return labels[type] || 'Otra';
                                };

                                return (
                                  <span className="text-muted-foreground">
                                    {expense.card.name}
                                    {expense.card.lastFourDigits && (
                                      <span className="ml-1 text-xs">
                                        (****{expense.card.lastFourDigits}
                                        {expense.card.type &&
                                          ` - ${getCardTypeLabel(
                                            expense.card.type as CardType,
                                          )}`}
                                        )
                                      </span>
                                    )}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-muted-foreground">
                                Tarjeta
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(expense.expenseDate || expense.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          expense.amount,
                          expense.currency || DEFAULT_CURRENCY,
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={(open) => {
          setIsExpenseDialogOpen(open);
          if (!open) {
            setSelectedExpense(null);
          }
        }}
        tripId={tripId}
        budgets={budgets}
        participants={participants}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </>
  );
}
