import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { TripDashboardCards } from '@/components/trip-dashboard-cards';
import { TripBudgetsSection } from '@/components/trip-budgets-section';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PlaneIcon } from 'lucide-react';
import { tripsService } from '@/services/tripsService';
import { budgetsService } from '@/services/budgetsService';
import { expensesService } from '@/services/expensesService';
import { participantsService } from '@/services/participantsService';
import { useTripsStore } from '@/store/tripsStore';
import { Budget } from '@/types/budget';
import { Expense } from '@/types/expense';
import { Participant } from '@/types/participant';
import { CreateExpenseDialog } from '@/components/create-expense-dialog';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setTrips = useTripsStore((state) => state.setTrips);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const setIsLoading = useTripsStore((state) => state.setIsLoading);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudgetedExpenses, setTotalBudgetedExpenses] = useState(0);
  const [totalUnbudgetedExpenses, setTotalUnbudgetedExpenses] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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
    const fetchData = async () => {
      if (!activeTrip) {
        setBudgets([]);
        setParticipants([]);
        setExpenses([]);
        setTotalExpenses(0);
        setTotalBudgetedExpenses(0);
        setTotalUnbudgetedExpenses(0);
        return;
      }

      try {
        const [budgetsResult, participantsResult, expensesResult] =
          await Promise.all([
            budgetsService
              .getAllBudgetsByTrip(activeTrip._id)
              .then(({ budgets }) => budgets)
              .catch(() => []),
            participantsService
              .getParticipants(activeTrip._id)
              .then(({ participants }) => participants)
              .catch(() => []),
            expensesService
              .getExpenses(activeTrip._id)
              .then(({ expenses }) => expenses)
              .catch(() => []),
          ]);

        setBudgets(budgetsResult);
        setParticipants(participantsResult);
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
        setParticipants([]);
        setExpenses([]);
        setTotalExpenses(0);
        setTotalBudgetedExpenses(0);
        setTotalUnbudgetedExpenses(0);
      }
    };

    fetchData();
  }, [activeTrip, refreshTrigger]);

  const handleBudgetsChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleExpenseEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleExpenseDelete = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }

    try {
      await expensesService.deleteExpense(expenseId);
      toast.success('Gasto eliminado exitosamente');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleExpenseSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsExpenseDialogOpen(false);
    setSelectedExpense(null);
  };

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
              totalBudgetedExpenses={totalBudgetedExpenses}
              totalUnbudgetedExpenses={totalUnbudgetedExpenses}
              currency={activeTrip.baseCurrency}
            />
          </div>
          <Separator />
          <div className="px-4 pb-4 lg:px-6">
            <RecentExpensesTable
              tripId={activeTrip._id}
              onEdit={handleExpenseEdit}
              onDelete={handleExpenseDelete}
              refreshTrigger={refreshTrigger}
              onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>
          <Separator />
          <div className="px-4 lg:px-6">
            <TripBudgetsSection
              tripId={activeTrip._id}
              tripName={activeTrip.name}
              budgets={budgets}
              expenses={expenses}
              onBudgetsChange={handleBudgetsChange}
            />
          </div>
        </div>
      </SidebarInset>

      <CreateExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={(open) => {
          setIsExpenseDialogOpen(open);
          if (!open) {
            setSelectedExpense(null);
          }
        }}
        tripId={activeTrip._id}
        budgets={budgets}
        participants={participants}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </SidebarProvider>
  );
}
