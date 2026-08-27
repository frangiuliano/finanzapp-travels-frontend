import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  ArrowDownToLine,
  Landmark,
  Pause,
  PiggyBank,
  Play,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CURRENCY_OPTIONS } from '@/constants/currencies';
import { parseMoneyInput } from '@/lib/money';
import { wealthService } from '@/services/wealthService';
import type {
  Holding,
  HoldingType,
  SavingsGoal,
  WealthOverview,
} from '@/types/wealth';

type DialogMode = 'holding' | 'balance' | 'goal' | 'contribution' | null;

const HOLDING_LABELS: Record<HoldingType, string> = {
  bank_account: 'Cuenta bancaria',
  virtual_wallet: 'Billetera virtual',
  cash: 'Efectivo',
  investment: 'Inversión',
  other: 'Otro',
};

const PACE_LABELS = {
  on_track: 'Al día',
  behind: 'Atrasado',
  no_plan: 'Sin ritmo',
  completed: 'Cumplido',
};

const GOAL_ICONS = [
  '🎯',
  '✈️',
  '🏠',
  '🚗',
  '🛟',
  '🎓',
  '💻',
  '💍',
  '🎁',
  '🏖️',
  '💰',
];

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function WealthPage() {
  const [overview, setOverview] = useState<WealthOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [holdingType, setHoldingType] = useState<HoldingType>('bank_account');
  const [currency, setCurrency] = useState('ARS');
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [priority, setPriority] = useState('5');
  const [icon, setIcon] = useState('🎯');
  const [holdingId, setHoldingId] = useState('');
  const [contributionKind, setContributionKind] = useState<
    'contribution' | 'withdrawal'
  >('contribution');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      setOverview(await wealthService.getOverview());
    } catch {
      toast.error('No se pudo cargar tu patrimonio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const resetForm = () => {
    setName('');
    setInstitution('');
    setHoldingType('bank_account');
    setCurrency('ARS');
    setAmount('');
    setTargetDate('');
    setMonthlyAmount('');
    setPriority('5');
    setIcon('🎯');
    setHoldingId('');
    setContributionKind('contribution');
    setNote('');
    setSelectedHolding(null);
    setSelectedGoal(null);
  };

  const closeDialog = () => {
    setDialogMode(null);
    resetForm();
  };

  const eligibleHoldings = useMemo(
    () =>
      (overview?.holdings ?? []).filter(
        (holding) =>
          holding.currency === selectedGoal?.currency &&
          (contributionKind === 'contribution' ||
            Boolean(
              selectedGoal?.allocations.some(
                (allocation) =>
                  allocation.holdingId === holding._id && allocation.amount > 0,
              ),
            )),
      ),
    [contributionKind, overview?.holdings, selectedGoal],
  );

  const openBalance = (holding: Holding) => {
    resetForm();
    setSelectedHolding(holding);
    setAmount(String(holding.currentBalance).replace('.', ','));
    setDialogMode('balance');
  };

  const openContribution = (goal: SavingsGoal) => {
    resetForm();
    setSelectedGoal(goal);
    const first = (overview?.holdings ?? []).find(
      (holding) =>
        holding.currency === goal.currency && holding.availableBalance > 0,
    );
    setHoldingId(first?._id ?? '');
    setDialogMode('contribution');
  };

  const submit = async () => {
    const parsedAmount = parseMoneyInput(amount);
    setIsSaving(true);
    try {
      if (dialogMode === 'holding') {
        if (!name.trim() || parsedAmount === null) {
          throw new Error('Completá el nombre y el saldo');
        }
        await wealthService.createHolding({
          name: name.trim(),
          institution: institution.trim() || undefined,
          type: holdingType,
          currency,
          currentBalance: parsedAmount,
        });
        toast.success('Tenencia agregada');
      } else if (dialogMode === 'balance' && selectedHolding) {
        if (parsedAmount === null) throw new Error('Ingresá el saldo actual');
        await wealthService.adjustBalance(selectedHolding._id, {
          balance: parsedAmount,
          note: note.trim() || undefined,
        });
        toast.success('Saldo actualizado');
      } else if (dialogMode === 'goal') {
        if (!name.trim() || parsedAmount === null || parsedAmount <= 0) {
          throw new Error('Completá el nombre y el monto objetivo');
        }
        await wealthService.createGoal({
          name: name.trim(),
          targetAmount: parsedAmount,
          currency,
          targetDate: targetDate || undefined,
          plannedMonthlyContribution:
            parseMoneyInput(monthlyAmount) ?? undefined,
          priority: Math.min(10, Math.max(1, Number(priority) || 5)),
          icon: icon.trim() || undefined,
        });
        toast.success('Objetivo creado');
      } else if (dialogMode === 'contribution' && selectedGoal) {
        if (!holdingId || parsedAmount === null || parsedAmount <= 0) {
          throw new Error('Elegí una tenencia e ingresá un importe');
        }
        await wealthService.contribute(selectedGoal._id, {
          holdingId,
          kind: contributionKind,
          amount: parsedAmount,
          note: note.trim() || undefined,
        });
        toast.success(
          contributionKind === 'contribution'
            ? 'Aporte registrado'
            : 'Dinero liberado',
        );
      }
      closeDialog();
      setIsLoading(true);
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : 'No se pudo guardar'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGoal = async (goal: SavingsGoal) => {
    try {
      await wealthService.updateGoal(goal._id, {
        status: goal.status === 'paused' ? 'active' : 'paused',
      });
      await load();
    } catch {
      toast.error('No se pudo actualizar el objetivo');
    }
  };

  const archiveHolding = async (holding: Holding) => {
    if (
      !confirm(`¿Eliminar "${holding.name}"? El historial quedará preservado.`)
    ) {
      return;
    }
    try {
      await wealthService.archiveHolding(holding._id);
      toast.success('Tenencia eliminada');
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo eliminar la tenencia',
      );
    }
  };

  const archiveGoal = async (goal: SavingsGoal) => {
    if (
      !confirm(
        `¿Eliminar el objetivo "${goal.name}"? El historial quedará preservado.`,
      )
    ) {
      return;
    }
    try {
      await wealthService.archiveGoal(goal._id);
      toast.success('Objetivo eliminado');
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo eliminar el objetivo',
      );
    }
  };

  if (isLoading && !overview) {
    return (
      <div className="w-full flex-1 space-y-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 px-4 py-6 pb-28 lg:px-6 md:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Patrimonio
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu dinero, tus objetivos y el avance real de cada ahorro.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void load()}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(overview?.totalsByCurrency ?? {}).map(
          ([totalCurrency, total]) => (
            <Card key={totalCurrency}>
              <CardHeader className="pb-2">
                <CardDescription>Total en {totalCurrency}</CardDescription>
                <CardTitle>{money(total.balance, totalCurrency)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {money(total.allocated, totalCurrency)} asignado ·{' '}
                {money(total.available, totalCurrency)} libre
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Tabs defaultValue="holdings">
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="holdings">Tenencias</TabsTrigger>
          <TabsTrigger value="goals">Objetivos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Mis ahorros
              </h2>
              <p className="text-xs text-muted-foreground">
                Actualizá los saldos para mantener el patrimonio al día.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogMode('holding')}>
              <Plus className="mr-1 size-4" /> Agregar
            </Button>
          </div>
          {overview?.holdings.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {overview.holdings.map((holding) => (
                <Card key={holding._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {holding.name}
                        </CardTitle>
                        <CardDescription>
                          {holding.institution || HOLDING_LABELS[holding.type]}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {holding.type === 'bank_account' ? (
                          <Landmark className="size-5 text-primary" />
                        ) : (
                          <WalletCards className="size-5 text-primary" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void archiveHolding(holding)}
                          aria-label={`Eliminar ${holding.name}`}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xl font-semibold tabular-nums">
                      {money(holding.currentBalance, holding.currency)}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Asignado{' '}
                        {money(holding.allocatedBalance, holding.currency)}
                      </span>
                      <span>
                        Libre{' '}
                        {money(holding.availableBalance, holding.currency)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openBalance(holding)}
                    >
                      Actualizar saldo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="Todavía no cargaste ahorros"
              text="Agregá cuentas, billeteras, efectivo o inversiones."
            />
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Objetivos</h2>
              <p className="text-xs text-muted-foreground">
                Cada aporte reserva dinero real de una tenencia.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogMode('goal')}>
              <Plus className="mr-1 size-4" /> Crear
            </Button>
          </div>
          {overview?.goals.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {overview.goals.map((goal) => (
                <Card
                  key={goal._id}
                  className={goal.status === 'paused' ? 'opacity-70' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <span className="text-xl">{goal.icon || '🎯'}</span>
                        <div>
                          <CardTitle className="text-base">
                            {goal.name}
                          </CardTitle>
                          <CardDescription>
                            Prioridad {goal.priority}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          goal.paceStatus === 'behind'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {PACE_LABELS[goal.paceStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <strong>
                          {money(goal.allocatedAmount, goal.currency)}
                        </strong>
                        <span className="text-muted-foreground">
                          de {money(goal.targetAmount, goal.currency)}
                        </span>
                      </div>
                      <Progress
                        value={goal.progressPercent}
                        className="h-2.5"
                      />
                      <p className="mt-1 text-right text-xs font-medium">
                        {goal.progressPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Metric
                        label="Falta"
                        value={money(goal.remainingAmount, goal.currency)}
                      />
                      <Metric
                        label="Necesario por mes"
                        value={
                          goal.requiredMonthlyContribution === null
                            ? 'Sin fecha límite'
                            : money(
                                goal.requiredMonthlyContribution,
                                goal.currency,
                              )
                        }
                      />
                      <Metric
                        label="Ritmo mensual"
                        value={money(
                          goal.actualMonthlyContribution,
                          goal.currency,
                        )}
                      />
                      <Metric
                        label="Fecha estimada"
                        value={
                          goal.estimatedCompletionDate
                            ? monthLabel(goal.estimatedCompletionDate)
                            : 'Sin datos'
                        }
                      />
                    </div>
                    {goal.allocations.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {goal.allocations.map((allocation) => {
                          const holding = overview.holdings.find(
                            (item) => item._id === allocation.holdingId,
                          );
                          return (
                            <p key={allocation._id}>
                              {holding?.name || 'Tenencia'}:{' '}
                              {money(allocation.amount, goal.currency)}
                            </p>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => openContribution(goal)}
                        disabled={goal.status === 'paused'}
                      >
                        <ArrowDownToLine className="mr-1 size-4" /> Aportar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void toggleGoal(goal)}
                        title={goal.status === 'paused' ? 'Reanudar' : 'Pausar'}
                      >
                        {goal.status === 'paused' ? (
                          <Play className="size-4" />
                        ) : (
                          <Pause className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void archiveGoal(goal)}
                        title="Eliminar objetivo"
                        aria-label={`Eliminar ${goal.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="Convertí tus ahorros en planes"
              text="Creá varios objetivos y asignales dinero sin duplicarlo."
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
              <CardDescription>
                Historial auditable de saldos y aportes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentEvents.length ? (
                overview.recentEvents.map((event) => {
                  const holding = overview.holdings.find(
                    (item) => item._id === event.holdingId,
                  );
                  const eventGoal = overview.goals.find(
                    (item) => item._id === event.goalId,
                  );
                  return (
                    <div
                      key={event._id}
                      className="flex justify-between gap-3 border-b pb-3 text-sm last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          {event.kind === 'contribution'
                            ? `Aporte a ${eventGoal?.name || 'objetivo'}`
                            : event.kind === 'withdrawal'
                              ? `Retiro de ${eventGoal?.name || 'objetivo'}`
                              : event.kind === 'initial_balance'
                                ? 'Saldo inicial'
                                : 'Actualización de saldo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holding?.name} ·{' '}
                          {new Date(event.occurredAt).toLocaleDateString(
                            'es-AR',
                          )}
                        </p>
                      </div>
                      <span className="tabular-nums">
                        {holding
                          ? money(event.amount, holding.currency)
                          : event.amount}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay actividad.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponsiveFormDialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title={
          dialogMode === 'holding'
            ? 'Nueva tenencia'
            : dialogMode === 'balance'
              ? 'Actualizar saldo'
              : dialogMode === 'goal'
                ? 'Nuevo objetivo'
                : 'Registrar aporte'
        }
        description={
          dialogMode === 'contribution'
            ? 'El aporte reserva dinero disponible; no modifica el saldo total.'
            : 'Completá los datos para mantener tu patrimonio actualizado.'
        }
      >
        <div className="space-y-4">
          {dialogMode === 'holding' ? (
            <>
              <Field label="Nombre">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Caja de ahorro"
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={holdingType}
                  onValueChange={(value) =>
                    setHoldingType(value as HoldingType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HOLDING_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Institución (opcional)">
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej: Mercado Pago"
                />
              </Field>
              <CurrencyField value={currency} onChange={setCurrency} />
              <AmountField
                label="Saldo actual"
                value={amount}
                onChange={setAmount}
              />
            </>
          ) : null}
          {dialogMode === 'balance' ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedHolding?.name} · No puede quedar por debajo del dinero
                ya asignado.
              </p>
              <AmountField
                label="Nuevo saldo"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Nota (opcional)">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Actualización mensual"
                />
              </Field>
            </>
          ) : null}
          {dialogMode === 'goal' ? (
            <>
              <div className="grid grid-cols-[72px_1fr] gap-3">
                <Field label="Ícono">
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger aria-label="Ícono del objetivo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_ICONS.map((goalIcon) => (
                        <SelectItem key={goalIcon} value={goalIcon}>
                          <span className="text-lg">{goalIcon}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Nombre">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Viaje a Japón"
                  />
                </Field>
              </div>
              <CurrencyField value={currency} onChange={setCurrency} />
              <AmountField
                label="Monto objetivo"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Fecha límite (opcional)">
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </Field>
              <AmountField
                label="Aporte mensual planificado (opcional)"
                value={monthlyAmount}
                onChange={setMonthlyAmount}
              />
              <Field label="Prioridad">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  onBlur={() =>
                    setPriority(
                      String(Math.min(10, Math.max(1, Number(priority) || 5))),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Del 1 al 10: 1 es la prioridad más alta y 10 la más baja.
                </p>
              </Field>
            </>
          ) : null}
          {dialogMode === 'contribution' ? (
            <>
              <Field label="Acción">
                <Select
                  value={contributionKind}
                  onValueChange={(value) => {
                    setContributionKind(value as 'contribution' | 'withdrawal');
                    setHoldingId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contribution">
                      Aportar al objetivo
                    </SelectItem>
                    <SelectItem value="withdrawal">
                      Retirar y liberar dinero
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Desde qué tenencia">
                <Select value={holdingId} onValueChange={setHoldingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una tenencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleHoldings.map((holding) => (
                      <SelectItem key={holding._id} value={holding._id}>
                        {holding.name} ·{' '}
                        {contributionKind === 'contribution'
                          ? `libre ${money(holding.availableBalance, holding.currency)}`
                          : `asignado ${money(
                              selectedGoal?.allocations.find(
                                (allocation) =>
                                  allocation.holdingId === holding._id,
                              )?.amount ?? 0,
                              holding.currency,
                            )}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <AmountField
                label="Importe"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Nota (opcional)">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Aporte de agosto"
                />
              </Field>
            </>
          ) : null}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => void submit()}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveFormDialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <MoneyInput value={value} onChange={onChange} />
    </Field>
  );
}

function CurrencyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="Moneda">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof TrendingUp;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
      <Icon className="mb-3 size-8 text-primary" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
