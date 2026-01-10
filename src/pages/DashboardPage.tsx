import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { TripDashboardCards } from '@/components/trip-dashboard-cards';
import { TripBudgetsSection } from '@/components/trip-budgets-section';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PlaneIcon } from 'lucide-react';
import { tripsService } from '@/services/tripsService';
import { budgetsService } from '@/services/budgetsService';
import { useTripsStore } from '@/store/tripsStore';
import { Budget } from '@/types/budget';

export default function DashboardPage() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setTrips = useTripsStore((state) => state.setTrips);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const setIsLoading = useTripsStore((state) => state.setIsLoading);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const activeTrip = currentTrip || trips[0];

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        const { trips: fetchedTrips } = await tripsService.getAllTrips();
        setTrips(fetchedTrips);

        // Si no hay viaje actual pero hay viajes, seleccionar el primero
        if (!currentTrip && fetchedTrips.length > 0) {
          setCurrentTrip(fetchedTrips[0]);
        }
      } catch (error) {
        console.error('Error al cargar viajes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [setTrips, setCurrentTrip, setIsLoading, currentTrip]);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!activeTrip) {
        setBudgets([]);
        return;
      }

      try {
        const { budgets: fetchedBudgets } =
          await budgetsService.getAllBudgetsByTrip(activeTrip._id);
        setBudgets(fetchedBudgets);
      } catch (error) {
        console.error('Error al cargar budgets:', error);
        setBudgets([]);
      }
    };

    fetchBudgets();
  }, [activeTrip]);

  const handleBudgetsChange = () => {
    if (activeTrip) {
      budgetsService
        .getAllBudgetsByTrip(activeTrip._id)
        .then(({ budgets: fetchedBudgets }) => {
          setBudgets(fetchedBudgets);
        })
        .catch((error) => {
          console.error('Error al recargar budgets:', error);
        });
    }
  };

  // TODO: Implementar cuando tengas el endpoint de gastos
  const totalExpenses = 0;

  if (!activeTrip) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="p-4 min-w-0 transition-all duration-200 ease-linear">
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <PlaneIcon className="size-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">No hay viaje seleccionado</h2>
              <p className="text-muted-foreground">
                Selecciona un viaje para ver el dashboard o crea uno nuevo
              </p>
            </div>
            <Button onClick={() => navigate('/trips')}>
              <PlaneIcon className="mr-2 h-4 w-4" />
              Ir a Mis Viajes
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-4 min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="px-4 pt-4 lg:px-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{activeTrip.name}</h1>
              <p className="text-muted-foreground">
                Dashboard del viaje seleccionado
              </p>
            </div>
            <TripDashboardCards
              tripName={activeTrip.name}
              budgets={budgets}
              totalExpenses={totalExpenses}
              currency={activeTrip.baseCurrency}
            />
          </div>
          <Separator />
          <div className="px-4 lg:px-6">
            <TripBudgetsSection
              tripId={activeTrip._id}
              tripName={activeTrip.name}
              budgets={budgets}
              onBudgetsChange={handleBudgetsChange}
            />
          </div>
          <Separator />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive tripId={activeTrip._id} />
          </div>
          <Separator />
          <div className="px-4 pb-4 lg:px-6">
            <RecentExpensesTable tripId={activeTrip._id} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
