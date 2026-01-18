import { useMemo, useEffect, useState } from 'react';
import { CreditCardIcon, ArrowRightIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useTripsStore } from '@/store/tripsStore';
import { expensesService } from '@/services/expensesService';
import type { Expense, ParticipantDebt } from '@/types/expense';
import { ExpenseStatus } from '@/types/expense';
import { formatDate } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

export function StatisticsCards() {
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allDebts, setAllDebts] = useState<ParticipantDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<ParticipantDebt | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTrip) {
        setAllExpenses([]);
        setAllDebts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [expensesResult, debtsResult] = await Promise.all([
          expensesService
            .getExpenses(currentTrip._id)
            .then(({ expenses }) => expenses)
            .catch(() => []),
          expensesService
            .getParticipantDebts(currentTrip._id)
            .then(({ debts }) => debts)
            .catch(() => []),
        ]);

        setAllExpenses(expensesResult);
        setAllDebts(debtsResult);
      } catch (error) {
        console.error('Error al cargar datos de estadísticas:', error);
        setAllExpenses([]);
        setAllDebts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTrip]);

  const cardsData = useMemo(() => {
    const cardMap = new Map<string, { name: string; total: number }>();

    allExpenses.forEach((expense) => {
      if (expense.cardId && expense.card) {
        const cardKey = expense.cardId;
        const current = cardMap.get(cardKey) || {
          name: expense.card.name || `****${expense.card.lastFourDigits}`,
          total: 0,
        };
        current.total += expense.amount;
        cardMap.set(cardKey, current);
      }
    });

    return Array.from(cardMap.values()).sort((a, b) => b.total - a.total);
  }, [allExpenses]);

  const totalDebts = useMemo(() => {
    return allDebts.reduce((sum, debt) => sum + debt.amount, 0);
  }, [allDebts]);

  const debtExpenses = useMemo(() => {
    if (!selectedDebt) return [];

    return allExpenses
      .filter((expense) => {
        if (expense.status !== 'pending') return false;

        const paidByParticipantId =
          typeof expense.paidByParticipantId === 'string'
            ? expense.paidByParticipantId
            : expense.paidByParticipant?._id;

        if (paidByParticipantId !== selectedDebt.toParticipantId) return false;

        if (!expense.splits || expense.splits.length === 0) return false;

        return expense.splits.some((split) => {
          const splitParticipantId =
            typeof split.participantId === 'string'
              ? split.participantId
              : split.participant?._id;
          return splitParticipantId === selectedDebt.fromParticipantId;
        });
      })
      .map((expense) => {
        const split = expense.splits?.find((split) => {
          const splitParticipantId =
            typeof split.participantId === 'string'
              ? split.participantId
              : split.participant?._id;
          return splitParticipantId === selectedDebt.fromParticipantId;
        });
        return {
          expense,
          debtAmount: split?.amount || 0,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.expense.expenseDate || b.expense.createdAt).getTime() -
          new Date(a.expense.expenseDate || a.expense.createdAt).getTime(),
      );
  }, [allExpenses, selectedDebt]);

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || DEFAULT_CURRENCY,
    }).format(amount);
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
    if (expense.paymentMethod === 'cash') return 'Efectivo';
    if (expense.paymentMethod === 'card') return 'Tarjeta';
    return '-';
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cargando estadísticas...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              <CardTitle className="text-lg sm:text-xl">Tarjetas</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Total gastado con cada tarjeta
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {cardsData.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {cardsData.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3 gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex size-8 sm:size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <CreditCardIcon className="size-4 sm:size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {card.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-semibold">
                        $
                        {card.total.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No hay gastos con tarjetas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <ArrowRightIcon className="size-5" />
              <CardTitle className="text-lg sm:text-xl">
                Deudas entre Participantes
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Resumen de deudas pendientes
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {allDebts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50 gap-2">
                  <div className="text-xs sm:text-sm font-medium">
                    Total de deudas pendientes
                  </div>
                  <div className="text-base sm:text-lg font-semibold shrink-0">
                    $
                    {totalDebts.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {allDebts.map((debt, index) => (
                    <div
                      key={`${debt.fromParticipantId}-${debt.toParticipantId}-${index}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors gap-2 cursor-pointer"
                      onClick={() => setSelectedDebt(debt)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                          <ArrowRightIcon className="size-3 sm:size-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {debt.fromParticipantName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            debe a {debt.toParticipantName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-xs sm:text-sm font-semibold">
                          $
                          {debt.amount.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No hay deudas pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedDebt}
        onOpenChange={(open) => !open && setSelectedDebt(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Gastos que generan la deuda
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedDebt && (
                <>
                  {selectedDebt.fromParticipantName} debe a{' '}
                  {selectedDebt.toParticipantName}:{' '}
                  {formatCurrency(selectedDebt.amount)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {debtExpenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron gastos relacionados con esta deuda
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
                      Monto deuda
                    </TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Monto total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtExpenses.map(({ expense, debtAmount }) => (
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
                          debtAmount,
                          expense.currency || DEFAULT_CURRENCY,
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
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
