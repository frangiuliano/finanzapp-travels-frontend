import { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { tripsService } from '@/services/tripsService';
import { useTripsStore } from '@/store/tripsStore';
import { StatisticsCards } from '@/components/statistics-cards';

export default function StatisticsPage() {
  const setTrips = useTripsStore((state) => state.setTrips);
  const setIsLoading = useTripsStore((state) => state.setIsLoading);

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        const { trips } = await tripsService.getAllTrips();
        setTrips(trips);
      } catch (error) {
        console.error('Error al cargar viajes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [setTrips, setIsLoading]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-4 min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="px-4 pt-4 lg:px-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Estadísticas</h1>
              <p className="text-muted-foreground">Resumen general</p>
            </div>
            <StatisticsCards />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
