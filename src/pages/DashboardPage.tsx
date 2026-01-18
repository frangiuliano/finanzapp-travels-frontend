import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { TripDashboardCards } from '@/components/trip-dashboard-cards';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { StatisticsCards } from '@/components/statistics-cards';
import { BudgetsOverview } from '@/components/budgets-overview';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PlaneIcon } from 'lucide-react';
import { tripsService } from '@/services/tripsService';
import { budgetsService } from '@/services/budgetsService';
import { expensesService } from '@/services/expensesService';
import {
  useTripsStore,
  getLastInteractedTripIdFromStorage,
} from '@/store/tripsStore';
import { Budget } from '@/types/budget';
import { Expense } from '@/types/expense';

export default function DashboardPage() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setTrips = useTripsStore((state) => state.setTrips);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const setIsLoading = useTripsStore((state) => state.setIsLoading);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudgetedExpenses, setTotalBudgetedExpenses] = useState(0);
  const [totalUnbudgetedExpenses, setTotalUnbudgetedExpenses] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const activeTrip = currentTrip || trips[0];

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        const { trips: fetchedTrips } = await tripsService.getAllTrips();
        setTrips(fetchedTrips);

        if (fetchedTrips.length > 0) {
          if (!currentTrip) {
            const lastInteractedTripId = getLastInteractedTripIdFromStorage();
            const lastTrip = lastInteractedTripId
              ? fetchedTrips.find((t) => t._id === lastInteractedTripId)
              : null;

            const tripToSelect = lastTrip || fetchedTrips[0];
            setCurrentTrip(tripToSelect);
          }
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
    const fetchData = async () => {
      if (!activeTrip) {
        setBudgets([]);
        setExpenses([]);
        setTotalExpenses(0);
        setTotalBudgetedExpenses(0);
        setTotalUnbudgetedExpenses(0);
        return;
      }

      try {
        const [budgetsResult, expensesResult] = await Promise.all([
          budgetsService
            .getAllBudgetsByTrip(activeTrip._id)
            .then(({ budgets }) => budgets)
            .catch(() => []),
          expensesService
            .getExpenses(activeTrip._id)
            .then(({ expenses }) => expenses)
            .catch(() => []),
        ]);

        setBudgets(budgetsResult);
        setExpenses(expensesResult);

        const total = expensesResult.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
        setTotalExpenses(total);

        const totalWithBudget = expensesResult
          .filter((expense) => expense.budgetId)
          .reduce((sum, expense) => sum + expense.amount, 0);
        setTotalBudgetedExpenses(totalWithBudget);

        const totalWithoutBudget = expensesResult
          .filter((expense) => !expense.budgetId)
          .reduce((sum, expense) => sum + expense.amount, 0);
        setTotalUnbudgetedExpenses(totalWithoutBudget);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setBudgets([]);
        setExpenses([]);
        setTotalExpenses(0);
        setTotalBudgetedExpenses(0);
        setTotalUnbudgetedExpenses(0);
      }
    };

    fetchData();
  }, [activeTrip, refreshTrigger]);

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
      <SidebarInset className="p-2 sm:p-4 min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0">
          <div className="px-2 sm:px-4 pt-4 lg:px-6">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold">
                {activeTrip.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Dashboard del viaje seleccionado
              </p>
            </div>
            <TripDashboardCards
              tripName={activeTrip.name}
              budgets={budgets}
              totalExpenses={totalExpenses}
              totalBudgetedExpenses={totalBudgetedExpenses}
              totalUnbudgetedExpenses={totalUnbudgetedExpenses}
              currency={activeTrip.baseCurrency}
            />
          </div>
          {budgets.length > 0 && (
            <>
              <Separator />
              <div className="px-4 lg:px-6">
                <BudgetsOverview
                  tripName={activeTrip.name}
                  budgets={budgets}
                  expenses={expenses}
                />
              </div>
            </>
          )}
          <Separator />
          <div className="px-2 sm:px-4 pb-4 lg:px-6">
            <RecentExpensesTable
              tripId={activeTrip._id}
              refreshTrigger={refreshTrigger}
              onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>
          <Separator />
          <div className="px-2 sm:px-4 pt-4 lg:px-6">
            <StatisticsCards />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
