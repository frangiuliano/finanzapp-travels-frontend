import { useMemo, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import { CreditCardIcon, ArrowRightIcon, StoreIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTripsStore } from '@/store/tripsStore';
import { expensesService } from '@/services/expensesService';
import type { Expense, ParticipantDebt } from '@/types/expense';

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-1))',
  },
  label: {
    color: 'var(--background)',
  },
} satisfies ChartConfig;

export function StatisticsCards() {
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allDebts, setAllDebts] = useState<ParticipantDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllMerchants, setShowAllMerchants] = useState(false);

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

  const allMerchantsData = useMemo(() => {
    const merchantMap = new Map<string, number>();

    allExpenses.forEach((expense) => {
      if (expense.merchantName) {
        const current = merchantMap.get(expense.merchantName) || 0;
        merchantMap.set(expense.merchantName, current + expense.amount);
      }
    });

    return Array.from(merchantMap.entries())
      .map(([name, total]) => ({ merchant: name, total }))
      .sort((a, b) => b.total - a.total);
  }, [allExpenses]);

  const merchantsData = useMemo(() => {
    return allMerchantsData.slice(0, 5);
  }, [allMerchantsData]);

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

  const renderChart = (data: typeof merchantsData, isDialog = false) => (
    <ChartContainer
      config={chartConfig}
      className={`w-full overflow-x-hidden aspect-auto ${isDialog ? 'h-[500px] sm:h-[600px]' : 'h-[300px] sm:h-[400px]'}`}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        barCategoryGap={4}
        margin={{
          right: 16,
        }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="merchant"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 15)}
          hide
          width={0}
        />
        <XAxis dataKey="total" type="number" hide />
        <Bar
          dataKey="total"
          layout="vertical"
          fill="var(--color-total)"
          radius={4}
        >
          <LabelList
            dataKey="merchant"
            position="insideLeft"
            offset={8}
            className="text-xs fill-[var(--color-label)]"
            fontSize={12}
          />
          <LabelList
            dataKey="total"
            position="right"
            offset={8}
            className="text-xs fill-foreground"
            fontSize={12}
            formatter={(value: number) =>
              `$${value.toLocaleString('es-ES', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );

  return (
    <div className="grid gap-4 sm:gap-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <StoreIcon className="size-5" />
            <CardTitle className="text-lg sm:text-xl">
              Gastos por Local
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            Top 5 locales donde más se ha gastado
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {merchantsData.length > 0 ? (
            renderChart(merchantsData)
          ) : (
            <div className="flex h-[300px] sm:h-[400px] items-center justify-center text-muted-foreground">
              No hay datos de locales disponibles
            </div>
          )}
        </CardContent>
        {allMerchantsData.length > 5 && (
          <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Button
              variant="outline"
              onClick={() => setShowAllMerchants(true)}
              className="w-full"
            >
              Ver todos ({allMerchantsData.length})
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showAllMerchants} onOpenChange={setShowAllMerchants}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Gastos por Local - Todos</DialogTitle>
            <DialogDescription>
              Todos los locales donde se ha gastado (ordenados de mayor a menor)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 w-full overflow-x-hidden">
            {allMerchantsData.length > 0 ? (
              <div className="w-full overflow-x-hidden">
                {renderChart(allMerchantsData, true)}
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                No hay datos de locales disponibles
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
