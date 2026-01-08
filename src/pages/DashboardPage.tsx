import { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { tripsService } from '@/services/tripsService';

export default function DashboardPage() {
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        await tripsService.getAllTrips();
      } catch (error) {
        console.error('Error al cargar viajes:', error);
      }
    };

    fetchTrips();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-4 min-w-0 md:ml-[18rem] md:peer-data-[state=collapsed]:ml-[3rem] transition-all duration-200 ease-linear">
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
