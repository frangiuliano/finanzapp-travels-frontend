'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { useIsMobile } from '@/hooks/use-mobile';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { tripsService } from '@/services/tripsService';

const chartConfig = {
  expenses: {
    label: 'Gastos',
  },
  shared: {
    label: 'Compartidos',
    color: 'hsl(var(--chart-1))',
  },
  personal: {
    label: 'Personales',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState(() => (isMobile ? '7d' : '30d'));
  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      shared: number;
      personal: number;
    }>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await tripsService.getAllTrips();
        const trips = data.trips || [];

        let mockData: Array<{ date: string; shared: number; personal: number }>;

        if (trips.length > 0) {
          // Generar datos de ejemplo basados en los viajes
          // TODO: Reemplazar con datos reales de gastos cuando esté disponible
          mockData = trips.map((trip) => ({
            date: new Date(trip.createdAt).toISOString().split('T')[0],
            shared: Math.floor(Math.random() * 500) + 100,
            personal: Math.floor(Math.random() * 300) + 50,
          }));
        } else {
          // Generar datos mock para los últimos 30 días si no hay viajes
          const today = new Date();
          mockData = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              shared: Math.floor(Math.random() * 400) + 150,
              personal: Math.floor(Math.random() * 250) + 80,
            };
          });
        }

        setChartData(mockData);
      } catch (error) {
        console.error('Error al cargar datos del gráfico:', error);
        // Si hay error, generar datos mock por defecto
        const today = new Date();
        const mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (29 - i));
          return {
            date: date.toISOString().split('T')[0],
            shared: Math.floor(Math.random() * 400) + 150,
            personal: Math.floor(Math.random() * 250) + 80,
          };
        });
        setChartData(mockData);
      }
    };

    fetchData();
  }, []);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  if (chartData.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Gastos por Viaje</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Gastos por Viaje</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total de gastos compartidos y personales
          </span>
          <span className="@[540px]/card:hidden">Gastos totales</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Últimos 3 meses
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Últimos 30 días
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Últimos 7 días
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Seleccionar período"
            >
              <SelectValue placeholder="Últimos 30 días" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillShared" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-shared)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-shared)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPersonal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-personal)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-personal)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('es-ES', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="personal"
              type="natural"
              fill="url(#fillPersonal)"
              stroke="var(--color-personal)"
              stackId="a"
            />
            <Area
              dataKey="shared"
              type="natural"
              fill="url(#fillShared)"
              stroke="var(--color-shared)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
