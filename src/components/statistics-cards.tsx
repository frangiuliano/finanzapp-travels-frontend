import { useMemo, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CreditCardIcon, ClockIcon, StoreIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useTripsStore } from '@/store/tripsStore';
import { expensesService } from '@/services/expensesService';
import type { Expense } from '@/types/expense';
import { ExpenseStatus } from '@/types/expense';

const chartConfig = {
  amount: {
    label: 'Monto',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function StatisticsCards() {
  const trips = useTripsStore((state) => state.trips);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const expensesPromises = trips.map((trip) =>
          expensesService
            .getExpenses(trip._id)
            .then(({ expenses }) => expenses)
            .catch(() => []),
        );

        const expensesResults = await Promise.all(expensesPromises);
        const flatExpenses = expensesResults.flat();
        setAllExpenses(flatExpenses);
      } catch (error) {
        console.error('Error al cargar datos de estadísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (trips.length > 0) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [trips]);

  const merchantsData = useMemo(() => {
    const merchantMap = new Map<string, number>();

    allExpenses.forEach((expense) => {
      if (expense.merchantName) {
        const current = merchantMap.get(expense.merchantName) || 0;
        merchantMap.set(expense.merchantName, current + expense.amount);
      }
    });

    return Array.from(merchantMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [allExpenses]);

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

  const pendingTotal = useMemo(() => {
    return allExpenses
      .filter((expense) => expense.status === ExpenseStatus.PENDING)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [allExpenses]);

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
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StoreIcon className="size-5" />
            <CardTitle>Gastos por Local</CardTitle>
          </div>
          <CardDescription>
            Locales donde más se ha gastado (ordenados de mayor a menor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {merchantsData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart
                data={merchantsData}
                margin={{ left: 20, right: 20, top: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `$${value.toLocaleString('es-ES', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `$${Number(value).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        'Total',
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-amount)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              No hay datos de locales disponibles
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              <CardTitle>Tarjetas</CardTitle>
            </div>
            <CardDescription>Total gastado con cada tarjeta</CardDescription>
          </CardHeader>
          <CardContent>
            {cardsData.length > 0 ? (
              <div className="space-y-4">
                {cardsData.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                        <CreditCardIcon className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{card.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
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
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClockIcon className="size-5" />
              <CardTitle>Pendientes</CardTitle>
            </div>
            <CardDescription>
              Total de gastos pendientes de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="flex size-20 items-center justify-center rounded-full bg-orange-500/10">
                <ClockIcon className="size-10 text-orange-500" />
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">
                  $
                  {pendingTotal.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {
                    allExpenses.filter(
                      (e) => e.status === ExpenseStatus.PENDING,
                    ).length
                  }{' '}
                  {allExpenses.filter((e) => e.status === ExpenseStatus.PENDING)
                    .length === 1
                    ? 'gasto pendiente'
                    : 'gastos pendientes'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
