import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trip, ParticipantRole } from '@/services/tripsService';
import { budgetsService } from '@/services/budgetsService';
import { participantsService } from '@/services/participantsService';
import { Budget } from '@/types/budget';
import type { Board } from '@/types/board';
import { Participant } from '@/types/participant';
import { CreateBudgetDialog } from '@/components/create-budget-dialog';
import { EditTripDialog } from '@/components/edit-trip-dialog';
import { CreateTripDialog } from '@/components/create-trip-dialog';
import { InviteParticipantDialog } from '@/components/invite-participant-dialog';
import { AddGuestDialog } from '@/components/add-guest-dialog';
import { InviteGuestDialog } from '@/components/invite-guest-dialog';
import { TripExpensesSection } from '@/components/trip-expenses-section';
import { requestConfirmation } from '@/lib/confirmation-events';
import { useBoardsStore } from '@/store/boardsStore';
import {
  boardToTrip,
  selectActiveBoard,
  tripToBoard,
} from '@/lib/board-trip-sync';
import { deleteBoardWithConfirm } from '@/lib/delete-board';
import { leaveBoardWithConfirm } from '@/lib/leave-board';
import { boardsService, isBoardMocksEnabled } from '@/services/boardsService';
import { toast } from 'sonner';
import {
  Pencil,
  Plus,
  Trash2,
  UsersIcon,
  UserPlus,
  Mail,
  CreditCard,
  BarChart3,
  LogOut,
  Plane,
} from 'lucide-react';
import { ManageCardsDialog } from '@/components/manage-cards-dialog';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';

export default function TravelPage() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const isLoadingBoards = useBoardsStore((state) => state.isLoading);

  const travelBoards = useMemo(
    () => boards.filter((board) => board.type === 'travel'),
    [boards],
  );
  const everydayBoards = useMemo(
    () => boards.filter((board) => board.type === 'everyday'),
    [boards],
  );
  const updateBoard = useBoardsStore((state) => state.updateBoard);

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [budgetsByBoard, setBudgetsByBoard] = useState<
    Record<string, Budget[]>
  >({});
  const [participantsByBoard, setParticipantsByBoard] = useState<
    Record<string, Participant[]>
  >({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedTripForEdit, setSelectedTripForEdit] = useState<Trip | null>(
    null,
  );
  const [isEditTripDialogOpen, setIsEditTripDialogOpen] = useState(false);
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false);
  const [selectedBoardForBudget, setSelectedBoardForBudget] = useState<
    string | null
  >(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [selectedBoardForInvite, setSelectedBoardForInvite] = useState<
    string | null
  >(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedBoardForAddGuest, setSelectedBoardForAddGuest] = useState<
    string | null
  >(null);
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false);
  const [selectedGuestForInvite, setSelectedGuestForInvite] =
    useState<Participant | null>(null);
  const [isInviteGuestDialogOpen, setIsInviteGuestDialogOpen] = useState(false);
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const mocksEnabled = isBoardMocksEnabled();

  const handleExpenseLinkChange = async (travelBoard: Board, value: string) => {
    try {
      const { board, message } = await boardsService.updateExpenseLink(
        travelBoard._id,
        value === '__none__' ? null : value,
      );
      updateBoard(board);
      toast.success(message);
    } catch {
      toast.error('No se pudo actualizar la vinculación del viaje');
    }
  };

  const activeTravelBoard = useMemo(() => {
    const preferredId =
      selectedBoardId ??
      (currentBoard?.type === 'travel' ? currentBoard._id : null) ??
      travelBoards[0]?._id ??
      null;
    return travelBoards.find((board) => board._id === preferredId) ?? null;
  }, [selectedBoardId, currentBoard, travelBoards]);

  useEffect(() => {
    if (
      currentBoard?.type === 'travel' &&
      !selectedBoardId &&
      travelBoards.some((board) => board._id === currentBoard._id)
    ) {
      setSelectedBoardId(currentBoard._id);
    }
  }, [currentBoard, selectedBoardId, travelBoards]);

  const fetchBoardData = useCallback(async (boardId: string) => {
    if (boardId.startsWith('mock-')) {
      return;
    }
    setIsLoadingDetails(true);
    try {
      const [budgetsResult, participantsResult] = await Promise.all([
        budgetsService
          .getAllBudgetsByTrip(boardId)
          .then(({ budgets }) => ({ budgets }))
          .catch((error) => {
            console.error(
              `Error al cargar presupuestos para tablero ${boardId}:`,
              error,
            );
            return { budgets: [] };
          }),
        participantsService
          .getParticipants(boardId)
          .then(({ participants }) => ({ participants }))
          .catch((error) => {
            console.error(
              `Error al cargar participantes para tablero ${boardId}:`,
              error,
            );
            return { participants: [] };
          }),
      ]);

      setBudgetsByBoard((prev) => ({
        ...prev,
        [boardId]: budgetsResult.budgets,
      }));
      setParticipantsByBoard((prev) => ({
        ...prev,
        [boardId]: participantsResult.participants,
      }));
    } catch (error) {
      console.error(`Error al cargar datos para tablero ${boardId}:`, error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (activeTravelBoard?._id) {
      void fetchBoardData(activeTravelBoard._id);
    }
  }, [activeTravelBoard?._id, fetchBoardData]);

  const handleSelectBoard = (board: Board) => {
    setSelectedBoardId(board._id);
    selectActiveBoard(board);
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTripForEdit(trip);
    setIsEditTripDialogOpen(true);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    const board =
      travelBoards.find((item) => item._id === trip._id) ?? tripToBoard(trip);
    const deleted = await deleteBoardWithConfirm(board);
    if (deleted) {
      setSelectedBoardId(null);
    }
  };

  const handleLeaveTrip = async (trip: Trip) => {
    const board =
      travelBoards.find((item) => item._id === trip._id) ?? tripToBoard(trip);
    const left = await leaveBoardWithConfirm(board);
    if (left) {
      setSelectedBoardId(null);
    }
  };

  const handleCreateBudget = (boardId: string) => {
    setSelectedBoardForBudget(boardId);
    setSelectedBudget(null);
    setIsBudgetDialogOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setSelectedBoardForBudget(budget.tripId);
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (budget: Budget) => {
    if (
      !(await requestConfirmation({
        title: '¿Eliminar presupuesto?',
        description: `Se eliminará “${budget.name}”. Los gastos del viaje se conservarán.`,
        confirmLabel: 'Eliminar presupuesto',
      }))
    ) {
      return;
    }

    try {
      await budgetsService.deleteBudget(budget._id);
      toast.success('Presupuesto eliminado exitosamente');
      if (activeTravelBoard) {
        void fetchBoardData(activeTravelBoard._id);
      }
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      toast.error('Error al eliminar el presupuesto');
    }
  };

  const handleTripCreated = (board: Board) => {
    setSelectedBoardId(board._id);
    selectActiveBoard(board);
  };

  const handleTripUpdated = () => {
    if (activeTravelBoard) {
      void fetchBoardData(activeTravelBoard._id);
    }
  };

  const handleBudgetSuccess = () => {
    if (activeTravelBoard) {
      void fetchBoardData(activeTravelBoard._id);
    }
  };

  const handleInviteParticipant = (boardId: string) => {
    setSelectedBoardForInvite(boardId);
    setIsInviteDialogOpen(true);
  };

  const handleParticipantInvited = () => {
    if (activeTravelBoard) {
      void fetchBoardData(activeTravelBoard._id);
    }
    setIsInviteDialogOpen(false);
    setSelectedBoardForInvite(null);
  };

  const handleRemoveParticipant = async (
    boardId: string,
    participantId: string,
  ) => {
    if (
      !(await requestConfirmation({
        title: '¿Quitar participante?',
        description:
          'Esta persona perderá el acceso al viaje. Los gastos y movimientos ya registrados se conservarán.',
        confirmLabel: 'Quitar participante',
      }))
    ) {
      return;
    }

    try {
      await participantsService.removeParticipant(boardId, participantId);
      toast.success('Participante eliminado exitosamente');
      if (activeTravelBoard) {
        void fetchBoardData(activeTravelBoard._id);
      }
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      toast.error('Error al eliminar el participante');
    }
  };

  const handleAddGuest = (boardId: string) => {
    setSelectedBoardForAddGuest(boardId);
    setIsAddGuestDialogOpen(true);
  };

  const handleGuestAdded = () => {
    if (activeTravelBoard) {
      void fetchBoardData(activeTravelBoard._id);
    }
    setIsAddGuestDialogOpen(false);
    setSelectedBoardForAddGuest(null);
  };

  const handleInviteGuest = (participant: Participant) => {
    setSelectedGuestForInvite(participant);
    setIsInviteGuestDialogOpen(true);
  };

  const handleGuestInvited = () => {
    if (activeTravelBoard) {
      void fetchBoardData(activeTravelBoard._id);
    }
    setIsInviteGuestDialogOpen(false);
    setSelectedGuestForInvite(null);
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

  const activeTrip = activeTravelBoard ? boardToTrip(activeTravelBoard) : null;

  return (
    <Fragment>
      <div className="w-full flex-1 space-y-4 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Viajes</h1>
            <p className="text-muted-foreground">
              Tableros de viaje: participantes, presupuestos y gastos
              compartidos
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {!mocksEnabled && (
              <Button
                onClick={() => setIsCreateTripDialogOpen(true)}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo viaje
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsCardsDialogOpen(true)}
              className="w-full md:w-auto"
              disabled={mocksEnabled || !activeTravelBoard}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Gestionar tarjetas
            </Button>
            <Button
              onClick={() => setIsExpenseDialogOpen(true)}
              className="w-full md:w-auto"
              disabled={mocksEnabled || !activeTravelBoard}
              variant={mocksEnabled ? 'outline' : 'default'}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo gasto
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Los gastos de viaje se incluyen en el consolidado mensual.{' '}
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver reportes
              <BarChart3 className="size-3.5" />
            </Link>
          </p>
        </div>

        <Separator />

        {mocksEnabled && (
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Modo mocks activo (`VITE_BOARD_MOCKS=true`). Los tableros de viaje
            son locales.
          </div>
        )}

        {isLoadingBoards ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Cargando…</p>
          </div>
        ) : travelBoards.length === 0 ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Plane className="size-6" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">No tenés viajes todavía</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Creá un tablero de viaje para dividir gastos con otros. Tu
                tablero cotidiano sigue disponible en{' '}
                <Link
                  to="/home"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Home
                </Link>
                .
              </p>
            </div>
            {!mocksEnabled && (
              <Button onClick={() => setIsCreateTripDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo viaje
              </Button>
            )}
          </div>
        ) : travelBoards.length > 1 ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Seleccioná un viaje para gestionar
            </p>
            <div className="flex flex-wrap gap-2">
              {travelBoards.map((board) => (
                <Button
                  key={board._id}
                  variant={
                    board._id === activeTravelBoard?._id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => handleSelectBoard(board)}
                  className="rounded-xl"
                >
                  <Plane className="mr-1.5 size-3.5" />
                  {board.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {activeTravelBoard && activeTrip ? (
          isLoadingDetails && !budgetsByBoard[activeTravelBoard._id] ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Cargando detalles…</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const trip = activeTrip;
                const budgets = budgetsByBoard[trip._id] || [];
                const participants = participantsByBoard[trip._id] || [];
                const totalBudget = budgets.reduce(
                  (sum, budget) => sum + budget.amount,
                  0,
                );

                return (
                  <div key={trip._id} className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl font-bold wrap-break-word">
                            {trip.name}
                          </h2>
                          <Badge variant={getRoleBadgeVariant(trip.userRole)}>
                            {getRoleLabel(trip.userRole)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground wrap-break-word">
                          Moneda base: {trip.baseCurrency}
                          {trip.createdBy && (
                            <>
                              {' '}
                              · Creado por {trip.createdBy.firstName}{' '}
                              {trip.createdBy.lastName}
                            </>
                          )}
                        </p>
                      </div>
                      {trip.userRole === ParticipantRole.MEMBER && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLeaveTrip(trip)}
                            className="flex-1 md:flex-none"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Abandonar
                          </Button>
                        </div>
                      )}
                      {trip.userRole === ParticipantRole.OWNER && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrip(trip)}
                            className="flex-1 md:flex-none"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Incluir en mis finanzas cotidianas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Select
                          value={
                            activeTravelBoard.linkedEverydayBoardId ??
                            '__none__'
                          }
                          onValueChange={(value) =>
                            void handleExpenseLinkChange(
                              activeTravelBoard,
                              value,
                            )
                          }
                          disabled={mocksEnabled}
                        >
                          <SelectTrigger className="w-full md:max-w-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              No incluir en otro tablero
                            </SelectItem>
                            {everydayBoards
                              .filter(
                                (board) =>
                                  board.baseCurrency === trip.baseCurrency,
                              )
                              .map((board) => (
                                <SelectItem key={board._id} value={board._id}>
                                  {board.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Esta preferencia es personal. En el tablero elegido
                          aparecerá solo tu parte de los gastos compartidos.
                        </p>
                      </CardContent>
                    </Card>

                    <TripExpensesSection
                      board={activeTravelBoard}
                      budgets={budgets}
                      participants={participants}
                      onExpensesChange={() => {
                        void fetchBoardData(trip._id);
                      }}
                    />

                    <Card>
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle>Presupuestos</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateBudget(trip._id)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar presupuesto
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
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
                            <div className="pt-2 border-t mt-4">
                              <p className="text-sm font-semibold text-right">
                                Total:{' '}
                                {formatCurrency(totalBudget, trip.baseCurrency)}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-5 w-5" />
                            <CardTitle>Participantes</CardTitle>
                            <Badge variant="outline" className="ml-2">
                              {participants.length}
                            </Badge>
                          </div>
                          {trip.userRole === ParticipantRole.OWNER && (
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleInviteParticipant(trip._id)
                                }
                                className="flex-1 sm:flex-none"
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Invitar por email
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddGuest(trip._id)}
                                className="flex-1 sm:flex-none"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Añadir invitado
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {participants.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay participantes en este viaje
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                {trip.userRole === ParticipantRole.OWNER && (
                                  <TableHead className="text-right">
                                    Acciones
                                  </TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {participants.map((participant) => {
                                const isGuest =
                                  !participant.userId && participant.guestName;

                                const displayName = isGuest
                                  ? participant.guestName!
                                  : typeof participant.userId === 'string'
                                    ? 'Usuario'
                                    : `${participant.userId?.firstName ?? ''} ${participant.userId?.lastName ?? ''}`.trim() ||
                                      'Usuario';

                                const displayEmail = isGuest
                                  ? participant.guestEmail || 'Sin email'
                                  : typeof participant.userId === 'string'
                                    ? ''
                                    : (participant.userId?.email ?? '');

                                const hasPendingInvitation =
                                  participant.invitationId &&
                                  (typeof participant.invitationId === 'object'
                                    ? participant.invitationId.status ===
                                      'pending'
                                    : true);

                                const participantId = participant._id;

                                return (
                                  <TableRow key={participant._id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        {displayName}
                                        {isGuest && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            Sin cuenta
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {displayEmail}
                                      {hasPendingInvitation && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          Invitación pendiente
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          participant.role ===
                                          ParticipantRole.OWNER
                                            ? 'default'
                                            : 'secondary'
                                        }
                                      >
                                        {participant.role ===
                                        ParticipantRole.OWNER
                                          ? 'Propietario'
                                          : 'Miembro'}
                                      </Badge>
                                    </TableCell>
                                    {trip.userRole === ParticipantRole.OWNER &&
                                      participant.role !==
                                        ParticipantRole.OWNER && (
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            {isGuest &&
                                              !hasPendingInvitation && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleInviteGuest(
                                                      participant,
                                                    )
                                                  }
                                                  title="Enviar invitación por email"
                                                >
                                                  <Mail className="h-4 w-4" />
                                                </Button>
                                              )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleRemoveParticipant(
                                                  trip._id,
                                                  participantId,
                                                )
                                              }
                                              title="Eliminar participante"
                                            >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
          )
        ) : null}
      </div>

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

      {selectedBoardForBudget && (
        <CreateBudgetDialog
          open={isBudgetDialogOpen}
          onOpenChange={(open) => {
            setIsBudgetDialogOpen(open);
            if (!open) {
              setSelectedBoardForBudget(null);
              setSelectedBudget(null);
            }
          }}
          tripId={selectedBoardForBudget}
          budget={selectedBudget}
          onSuccess={handleBudgetSuccess}
        />
      )}

      {selectedBoardForInvite && (
        <InviteParticipantDialog
          open={isInviteDialogOpen}
          onOpenChange={(open) => {
            setIsInviteDialogOpen(open);
            if (!open) {
              setSelectedBoardForInvite(null);
            }
          }}
          tripId={selectedBoardForInvite}
          tripName={
            travelBoards.find((b) => b._id === selectedBoardForInvite)?.name
          }
          onSuccess={handleParticipantInvited}
        />
      )}

      {selectedBoardForAddGuest && (
        <AddGuestDialog
          open={isAddGuestDialogOpen}
          onOpenChange={(open) => {
            setIsAddGuestDialogOpen(open);
            if (!open) {
              setSelectedBoardForAddGuest(null);
            }
          }}
          tripId={selectedBoardForAddGuest}
          tripName={
            travelBoards.find((b) => b._id === selectedBoardForAddGuest)?.name
          }
          onSuccess={handleGuestAdded}
        />
      )}

      {selectedGuestForInvite && (
        <InviteGuestDialog
          open={isInviteGuestDialogOpen}
          onOpenChange={(open) => {
            setIsInviteGuestDialogOpen(open);
            if (!open) {
              setSelectedGuestForInvite(null);
            }
          }}
          participant={selectedGuestForInvite}
          onSuccess={handleGuestInvited}
        />
      )}

      <ManageCardsDialog
        open={isCardsDialogOpen}
        onOpenChange={setIsCardsDialogOpen}
        onSuccess={() => {}}
      />

      {activeTravelBoard && (
        <ExpenseFormDialog
          open={isExpenseDialogOpen}
          onOpenChange={setIsExpenseDialogOpen}
          board={activeTravelBoard}
          budgets={budgetsByBoard[activeTravelBoard._id] || []}
          participants={participantsByBoard[activeTravelBoard._id] || []}
          onSuccess={() => {
            void fetchBoardData(activeTravelBoard._id);
          }}
        />
      )}
    </Fragment>
  );
}
