import { TrendingUpIcon, PlaneIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar-context';
import { useTripsStore } from '@/store/tripsStore';

export function StatisticsCards() {
  const { state } = useSidebar();
  const trips = useTripsStore((state) => state.trips);

  const stats = useMemo(() => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        activeTrips: 0,
      };
    }

    const totalTrips = trips.length;
    const now = new Date().getTime();
    const activeTrips = trips.filter((trip) => {
      const createdAt = new Date(trip.createdAt).getTime();
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;

    return {
      totalTrips,
      activeTrips,
    };
  }, [trips]);

  const gridCols =
    state === 'collapsed'
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      className={`grid gap-4 ${gridCols} *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card`}
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
    </div>
  );
}
