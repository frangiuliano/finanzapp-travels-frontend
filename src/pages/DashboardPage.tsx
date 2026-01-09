import { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { tripsService } from '@/services/tripsService';
import { useTripsStore } from '@/store/tripsStore';

export default function DashboardPage() {
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
            <SectionCards />
          </div>
          <Separator />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <Separator />
          <div className="px-4 pb-4 lg:px-6">
            <RecentExpensesTable />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
