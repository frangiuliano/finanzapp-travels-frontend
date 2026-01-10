import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tripsService, Trip, ParticipantRole } from '@/services/tripsService';
import { budgetsService } from '@/services/budgetsService';
import { Budget } from '@/types/budget';
import { CreateBudgetDialog } from '@/components/create-budget-dialog';
import { EditTripDialog } from '@/components/edit-trip-dialog';
import { CreateTripDialog } from '@/components/create-trip-dialog';
import { useTripsStore } from '@/store/tripsStore';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function TripsPage() {
  const [trips, setTrips] = useState<(Trip & { userRole?: ParticipantRole })[]>(
    [],
  );
  const [budgetsByTrip, setBudgetsByTrip] = useState<Record<string, Budget[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTripForEdit, setSelectedTripForEdit] = useState<Trip | null>(
    null,
  );
  const [isEditTripDialogOpen, setIsEditTripDialogOpen] = useState(false);
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false);
  const [selectedTripForBudget, setSelectedTripForBudget] = useState<
    string | null
  >(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);

  const removeTrip = useTripsStore((state) => state.removeTrip);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const { trips: fetchedTrips } = await tripsService.getAllTrips();
      setTrips(fetchedTrips);

      // Cargar budgets para cada trip
      const budgetsPromises = fetchedTrips.map(async (trip) => {
        try {
          const { budgets } = await budgetsService.getAllBudgetsByTrip(
            trip._id,
          );
          return { tripId: trip._id, budgets };
        } catch (error) {
          console.error(
            `Error al cargar budgets para trip ${trip._id}:`,
            error,
          );
          return { tripId: trip._id, budgets: [] };
        }
      });

      const budgetsResults = await Promise.all(budgetsPromises);
      const budgetsMap: Record<string, Budget[]> = {};
      budgetsResults.forEach(({ tripId, budgets }) => {
        budgetsMap[tripId] = budgets;
      });
      setBudgetsByTrip(budgetsMap);
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      toast.error('Error al cargar los viajes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTripForEdit(trip);
    setIsEditTripDialogOpen(true);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el viaje "${trip.name}"? Esta acción eliminará todos los presupuestos, participantes e invitaciones asociadas y no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await tripsService.deleteTrip(trip._id);
      toast.success('Viaje eliminado exitosamente');
      removeTrip(trip._id);
      fetchTrips(); // Recargar la lista completa
    } catch (error) {
      console.error('Error al eliminar viaje:', error);
      toast.error('Error al eliminar el viaje');
    }
  };

  const handleCreateBudget = (tripId: string) => {
    setSelectedTripForBudget(tripId);
    setSelectedBudget(null);
    setIsBudgetDialogOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setSelectedTripForBudget(budget.tripId);
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (budget: Budget) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el presupuesto "${budget.name}"?`,
      )
    ) {
      return;
    }

    try {
      await budgetsService.deleteBudget(budget._id);
      toast.success('Presupuesto eliminado exitosamente');
      fetchTrips(); // Recargar para actualizar los budgets
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      toast.error('Error al eliminar el presupuesto');
    }
  };

  const handleTripCreated = () => {
    fetchTrips();
  };

  const handleTripUpdated = () => {
    fetchTrips();
  };

  const handleBudgetSuccess = () => {
    fetchTrips();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getRoleBadgeVariant = (role?: ParticipantRole) => {
    return role === ParticipantRole.OWNER ? 'default' : 'secondary';
  };

  const getRoleLabel = (role?: ParticipantRole) => {
    return role === ParticipantRole.OWNER ? 'Propietario' : 'Miembro';
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-4 min-w-0 transition-all duration-200 ease-linear">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-4 px-4 pt-4 lg:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mis Viajes</h1>
              <p className="text-muted-foreground">
                Gestiona tus viajes y presupuestos
              </p>
            </div>
            <Button
              onClick={() => setIsCreateTripDialogOpen(true)}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Viaje
            </Button>
          </div>
          <Separator />

          {isLoading ? (
            <div className="px-4 py-8 text-center lg:px-6">
              <p>Cargando viajes...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="px-4 py-8 text-center lg:px-6">
              <p className="text-muted-foreground">
                No tienes viajes aún. ¡Crea tu primer viaje!
              </p>
            </div>
          ) : (
            <div className="px-4 pb-4 lg:px-6 space-y-6">
              {trips.map((trip) => {
                const budgets = budgetsByTrip[trip._id] || [];
                const totalBudget = budgets.reduce(
                  (sum, budget) => sum + budget.amount,
                  0,
                );

                return (
                  <Card key={trip._id}>
                    <CardHeader>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <CardTitle className="wrap-break-word">
                              {trip.name}
                            </CardTitle>
                            <Badge variant={getRoleBadgeVariant(trip.userRole)}>
                              {getRoleLabel(trip.userRole)}
                            </Badge>
                          </div>
                          <CardDescription className="wrap-break-word">
                            Moneda base: {trip.baseCurrency}
                            {trip.createdBy && (
                              <>
                                {' '}
                                · Creado por {trip.createdBy.firstName}{' '}
                                {trip.createdBy.lastName}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        {trip.userRole === ParticipantRole.OWNER && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTrip(trip)}
                              className="flex-1 md:flex-none"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span className="sm:hidden">Editar Viaje</span>
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTrip(trip)}
                              className="text-destructive hover:text-destructive flex-1 md:flex-none"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-semibold">Presupuestos</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateBudget(trip._id)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Presupuesto
                          </Button>
                        </div>

                        {budgets.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay presupuestos para este viaje
                          </p>
                        ) : (
                          <>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nombre</TableHead>
                                  <TableHead>Monto</TableHead>
                                  <TableHead>Moneda</TableHead>
                                  <TableHead className="text-right">
                                    Acciones
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {budgets.map((budget) => (
                                  <TableRow key={budget._id}>
                                    <TableCell className="font-medium">
                                      {budget.name}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(
                                        budget.amount,
                                        budget.currency,
                                      )}
                                    </TableCell>
                                    <TableCell>{budget.currency}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleEditBudget(budget)
                                          }
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteBudget(budget)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <div className="pt-2 border-t">
                              <p className="text-sm font-semibold text-right">
                                Total:{' '}
                                {formatCurrency(totalBudget, trip.baseCurrency)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>

      <CreateTripDialog
        open={isCreateTripDialogOpen}
        onOpenChange={setIsCreateTripDialogOpen}
        onSuccess={handleTripCreated}
      />

      {selectedTripForEdit && (
        <EditTripDialog
          open={isEditTripDialogOpen}
          onOpenChange={setIsEditTripDialogOpen}
          trip={selectedTripForEdit}
          onSuccess={handleTripUpdated}
        />
      )}

      {selectedTripForBudget && (
        <CreateBudgetDialog
          open={isBudgetDialogOpen}
          onOpenChange={(open) => {
            setIsBudgetDialogOpen(open);
            if (!open) {
              setSelectedTripForBudget(null);
              setSelectedBudget(null);
            }
          }}
          tripId={selectedTripForBudget}
          budget={selectedBudget}
          onSuccess={handleBudgetSuccess}
        />
      )}
    </SidebarProvider>
  );
}
