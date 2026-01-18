import { useMemo, useEffect, useState } from 'react';
import { CreditCardIcon, ArrowRightIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTripsStore } from '@/store/tripsStore';
import { expensesService } from '@/services/expensesService';
import type { Expense, ParticipantDebt } from '@/types/expense';

export function StatisticsCards() {
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allDebts, setAllDebts] = useState<ParticipantDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                      <div className="flex size-8 sm:size-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <CreditCardIcon className="size-4 sm:size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {card.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
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
                  <div className="text-base sm:text-lg font-semibold flex-shrink-0">
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
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-red-500/10 flex-shrink-0">
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
                      <div className="text-right ml-2 flex-shrink-0">
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
    </div>
  );
}
