import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Settings2, Trash2, LogOut, CalendarPlus, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageCategoriesSection } from '@/components/manage-categories-section';
import { ManagePaymentMethodsSection } from '@/components/manage-payment-methods-section';
import { ManageRecurringIncomesSection } from '@/components/manage-recurring-incomes-section';
import { ManageRecurringExpensesSection } from '@/components/manage-recurring-expenses-section';
import { ManageInstallmentPlansSection } from '@/components/manage-installment-plans-section';
import { ManageBoardParticipantsSection } from '@/components/manage-board-participants-section';
import { useBoardsStore } from '@/store/boardsStore';
import { ParticipantRole } from '@/services/tripsService';
import { deleteBoardWithConfirm } from '@/lib/delete-board';
import { leaveBoardWithConfirm } from '@/lib/leave-board';
import { forecastService } from '@/services/forecastService';
import { formatYearMonth } from '@/lib/utils';
import { archiveBoardWithConfirm } from '@/lib/archive-board';

export default function BoardSettingsPage() {
  const [searchParams] = useSearchParams();
  const organizationTab =
    searchParams.get('tab') === 'payment-methods'
      ? 'payment-methods'
      : 'categories';
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const activeBoard = currentBoard || boards[0] || null;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isExtendingHorizon, setIsExtendingHorizon] = useState(false);

  const handleExtendHorizon = async () => {
    if (!activeBoard) return;
    setIsExtendingHorizon(true);
    try {
      const result = await forecastService.ensureHorizon(activeBoard._id);
      toast.success(
        `Planificación extendida hasta ${formatYearMonth(result.horizonEnd)} (${result.generated} nuevos movimientos)`,
      );
    } catch {
      toast.error('No se pudo extender la planificación');
    } finally {
      setIsExtendingHorizon(false);
    }
  };

  if (!activeBoard) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Settings2 className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">
          Configuración del tablero
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Necesitás un tablero activo para gestionar categorías y medios de
          pago. Creá uno desde el wizard de onboarding.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/onboarding">Crear tablero</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 px-4 py-6 lg:px-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Configuración del tablero
        </h1>
        <p className="text-sm text-muted-foreground">
          Organización y planificación para{' '}
          <span className="font-medium text-foreground">
            {activeBoard.name}
          </span>
          .
        </p>
      </div>

      {activeBoard.type === 'everyday' ? (
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">
              Ingresos y compromisos recurrentes
            </CardTitle>
            <CardDescription>
              Ingresos recurrentes, gastos fijos y cuotas. Se materializan como
              movimientos programados hasta 12 meses adelante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={isExtendingHorizon}
              onClick={() => void handleExtendHorizon()}
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              {isExtendingHorizon
                ? 'Extendiendo…'
                : 'Extender planificación 12 meses'}
            </Button>
            <Tabs defaultValue="recurring-incomes" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="recurring-incomes">Ingresos</TabsTrigger>
                <TabsTrigger value="fixed-expenses">Gastos fijos</TabsTrigger>
                <TabsTrigger value="installments">Cuotas</TabsTrigger>
              </TabsList>
              <TabsContent value="recurring-incomes">
                <ManageRecurringIncomesSection
                  boardId={activeBoard._id}
                  currency={activeBoard.baseCurrency}
                />
              </TabsContent>
              <TabsContent value="fixed-expenses">
                <ManageRecurringExpensesSection
                  boardId={activeBoard._id}
                  currency={activeBoard.baseCurrency}
                />
              </TabsContent>
              <TabsContent value="installments">
                <ManageInstallmentPlansSection
                  boardId={activeBoard._id}
                  currency={activeBoard.baseCurrency}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Participantes</CardTitle>
          <CardDescription>
            Invitá personas y administrá quién puede colaborar en este tablero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManageBoardParticipantsSection board={activeBoard} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Organización</CardTitle>
          <CardDescription>
            Gestioná cómo clasificás gastos y con qué medios pagás en este
            tablero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={organizationTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="categories">Categorías</TabsTrigger>
              <TabsTrigger value="payment-methods">Medios de pago</TabsTrigger>
            </TabsList>
            <TabsContent value="categories">
              <ManageCategoriesSection boardId={activeBoard._id} />
            </TabsContent>
            <TabsContent value="payment-methods">
              <ManagePaymentMethodsSection
                boardId={activeBoard._id}
                boardName={activeBoard.name}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {activeBoard.userRole === ParticipantRole.MEMBER ? (
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">
              Abandonar tablero
            </CardTitle>
            <CardDescription>
              Dejás de ver este tablero en tu cuenta. No se borran los datos
              para el propietario ni los demás participantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={isLeaving}
              onClick={async () => {
                setIsLeaving(true);
                try {
                  await leaveBoardWithConfirm(activeBoard);
                } finally {
                  setIsLeaving(false);
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLeaving ? 'Saliendo…' : 'Abandonar tablero'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeBoard.userRole === ParticipantRole.OWNER ? (
        <Card className="rounded-2xl border-destructive/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg text-destructive">
              Zona de peligro
            </CardTitle>
            <CardDescription>
              Eliminá este tablero para empezar de cero. Esta acción es
              permanente y no se puede deshacer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeBoard.type !== 'everyday' ? (
              <Button
                variant="outline"
                className="mr-2"
                disabled={isArchiving}
                onClick={async () => {
                  setIsArchiving(true);
                  try {
                    await archiveBoardWithConfirm(activeBoard);
                  } finally {
                    setIsArchiving(false);
                  }
                }}
              >
                <Archive className="mr-2 h-4 w-4" />
                {isArchiving ? 'Archivando…' : 'Archivar tablero'}
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteBoardWithConfirm(activeBoard);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Eliminando…' : 'Eliminar tablero'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
