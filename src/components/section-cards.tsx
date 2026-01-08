import { TrendingUpIcon, PlaneIcon, WalletIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar';
import { tripsService } from '@/services/tripsService';

export function SectionCards() {
  const { state } = useSidebar();
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalExpenses: 0,
    participants: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await tripsService.getAllTrips();
        const trips = data.trips || [];
        setStats({
          totalTrips: trips.length,
          activeTrips: trips.filter((trip) => {
            // Considerar activos los viajes de los últimos 30 días
            const createdAt = new Date(trip.createdAt);
            const daysDiff =
              (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
          }).length,
          totalExpenses: 0, // TODO: Implementar cuando tengas el endpoint de gastos
          participants: 0, // TODO: Implementar cuando tengas el endpoint de participantes
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    fetchStats();
  }, []);

  const gridCols =
    state === 'collapsed'
      ? 'grid-cols-1 md:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      className={`grid gap-4 ${gridCols} *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card`}
    >
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total de Viajes</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.totalTrips}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <PlaneIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Todos tus viajes registrados
          </div>
          <div className="text-muted-foreground">
            Viajes creados desde el inicio
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Viajes Activos</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.activeTrips}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Recientes
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Viajes de los últimos 30 días <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Viajes en curso o recientes
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Gastos Totales</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            ${stats.totalExpenses.toLocaleString()}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <WalletIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total acumulado <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">En todos tus viajes</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Participantes</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.participants}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <UsersIcon className="size-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total de participantes <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">En todos tus viajes</div>
        </CardFooter>
      </Card>
    </div>
  );
}
