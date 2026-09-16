import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Archive,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Pause,
  Play,
  Plus,
  Target,
  Trash2,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '@/constants/currencies';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { cn } from '@/lib/utils';
import { goalsService } from '@/services/goalsService';
import { wealthService } from '@/services/wealthService';
import { useBoardsStore } from '@/store/boardsStore';
import type {
  Goal,
  GoalHoldingSelectionInput,
  GoalPreviewResponse,
  GoalWithResult,
} from '@/types/goals';
import type { Holding } from '@/types/wealth';

type GoalFormMode = 'date' | 'contribution';

interface GoalFormState {
  name: string;
  icon: string;
  targetAmount: string;
  currency: string;
  planningMode: GoalFormMode;
  targetDate: string;
  desiredMonthlyContribution: string;
  priority: string;
  useEstimatedFxForForecast: boolean;
  holdingSelections: GoalHoldingSelectionInput[];
}

const EMPTY_FORM: GoalFormState = {
  name: '',
  icon: '🎯',
  targetAmount: '',
  currency: DEFAULT_CURRENCY,
  planningMode: 'date',
  targetDate: '',
  desiredMonthlyContribution: '',
  priority: '5',
  useEstimatedFxForForecast: false,
  holdingSelections: [],
};

const ESTIMATE_NOTICE =
  'Esta estimación usa tus ingresos, gastos fijos y cuotas conocidos. No reduce tu disponible ni garantiza el resultado.';

const GOAL_ICONS = [
  '🎯',
  '🛟',
  '🏠',
  '🚗',
  '✈️',
  '🎓',
  '💻',
  '💍',
  '🏖️',
  '💰',
  '📱',
  '✨',
] as const;

export default function GoalsPage() {
  const boards = useBoardsStore((state) => state.boards);
  const everydayBoard = boards.find((board) => board.type === 'everyday');
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalWithResult | null>(null);
  const [form, setForm] = useState<GoalFormState>(EMPTY_FORM);
  const [preview, setPreview] = useState<GoalPreviewResponse | null>(null);

  const canQuery = !!everydayBoard && !everydayBoard._id.startsWith('mock-');
  const goalsQuery = useQuery({
    queryKey: ['goals', everydayBoard?._id],
    queryFn: () => goalsService.list(everydayBoard!._id),
    enabled: canQuery,
  });
  const holdingsQuery = useQuery({
    queryKey: ['wealth-overview', everydayBoard?._id],
    queryFn: () => wealthService.getOverview(everydayBoard!._id),
    enabled: canQuery,
  });

  useEffect(() => {
    if (goalsQuery.isError) toast.error('No se pudieron cargar tus objetivos');
  }, [goalsQuery.isError]);
  useEffect(() => {
    if (holdingsQuery.isError) {
      toast.error('No se pudieron cargar las tenencias disponibles');
    }
  }, [holdingsQuery.isError]);

  const refreshGoals = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['goals', everydayBoard?._id],
    });
  };

  const previewMutation = useMutation({
    mutationFn: () =>
      goalsService.preview(
        everydayBoard!._id,
        buildPreviewInput(form, editing),
      ),
    onSuccess: setPreview,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = buildPreviewInput(form, editing);
      if (editing) {
        await goalsService.update(everydayBoard!._id, editing.goal._id, {
          name: input.name,
          icon: input.icon,
          targetAmount: input.targetAmount,
          targetDate: input.targetDate,
          desiredMonthlyContribution: input.desiredMonthlyContribution,
          priority: input.priority,
          useEstimatedFxForForecast: input.useEstimatedFxForForecast,
        });
        return goalsService.updateHoldings(
          everydayBoard!._id,
          editing.goal._id,
          { holdingSelections: input.holdingSelections },
        );
      }
      return goalsService.create(everydayBoard!._id, input);
    },
    onSuccess: async () => {
      toast.success(editing ? 'Objetivo actualizado' : 'Objetivo creado');
      closeForm();
      await refreshGoals();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      goalId,
      status,
    }: {
      goalId: string;
      status: Goal['status'];
    }) => goalsService.update(everydayBoard!._id, goalId, { status }),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.status === 'archived'
          ? 'Objetivo archivado'
          : variables.status === 'paused'
            ? 'Objetivo pausado'
            : 'Objetivo reanudado',
      );
      await refreshGoals();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) =>
      goalsService.remove(everydayBoard!._id, goalId),
    onSuccess: async () => {
      toast.success('Objetivo eliminado');
      await refreshGoals();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const openCreate = () => {
    setEditing(null);
    setPreview(null);
    setForm({
      ...EMPTY_FORM,
      currency: everydayBoard?.baseCurrency ?? DEFAULT_CURRENCY,
    });
    setFormOpen(true);
  };

  const openEdit = (item: GoalWithResult) => {
    const { goal, selections } = item;
    setEditing(item);
    setPreview(null);
    setForm({
      name: goal.name,
      icon: goal.icon ?? '🎯',
      targetAmount: formatMoneyInputFromNumber(goal.targetAmount),
      currency: goal.currency,
      planningMode: goal.targetDate ? 'date' : 'contribution',
      targetDate: goal.targetDate?.slice(0, 10) ?? '',
      desiredMonthlyContribution: goal.desiredMonthlyContribution
        ? formatMoneyInputFromNumber(goal.desiredMonthlyContribution)
        : '',
      priority: String(goal.priority),
      useEstimatedFxForForecast: goal.useEstimatedFxForForecast,
      holdingSelections: selections.map((selection) => ({
        holdingId: selection.holdingId,
        useEstimatedFx: selection.useEstimatedFx,
      })),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setPreview(null);
    setForm(EMPTY_FORM);
  };

  const requestPreview = () => {
    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    previewMutation.mutate();
  };

  if (!everydayBoard) {
    return (
      <CenteredState
        title="Objetivos"
        description="Necesitás un tablero cotidiano para planificar tus objetivos."
      />
    );
  }

  if (everydayBoard._id.startsWith('mock-')) {
    return (
      <CenteredState
        title="Objetivos"
        description="Cambiá al tablero cotidiano conectado a la API para gestionar objetivos."
      />
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 px-4 pt-6 pb-28 md:pb-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Objetivos
          </h1>
          <p className="text-sm text-muted-foreground">
            Planificá metas con el patrimonio y la capacidad mensual de{' '}
            <span className="font-medium">{everydayBoard.name}</span>.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full rounded-xl sm:w-auto">
          <Plus className="size-4" /> Nuevo objetivo
        </Button>
      </div>

      <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {ESTIMATE_NOTICE}
      </p>

      {goalsQuery.isLoading ? (
        <GoalsSkeleton />
      ) : goalsQuery.isError ? (
        <CenteredState
          title="No pudimos cargar tus objetivos"
          description="Reintentá para volver a consultar la planificación."
          action={
            <Button onClick={() => void goalsQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <>
          <SummaryCards summary={goalsQuery.data!.summary} />
          {goalsQuery.data!.goals.length === 0 ? (
            <CenteredState
              title="Todavía no tenés objetivos"
              description="Creá una meta y elegí qué tenencias querés considerar para alcanzarla."
              action={
                <Button onClick={openCreate}>Crear mi primer objetivo</Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {goalsQuery.data!.goals.map((item) => (
                <GoalCard
                  key={item.goal._id}
                  item={item}
                  holdings={holdingsQuery.data?.holdings ?? []}
                  boardId={everydayBoard._id}
                  onEdit={() => openEdit(item)}
                  onStatus={(status) =>
                    statusMutation.mutate({ goalId: item.goal._id, status })
                  }
                  onDelete={() => {
                    if (
                      window.confirm(
                        `¿Eliminar “${item.goal.name}”? Esta acción no se puede deshacer.`,
                      )
                    ) {
                      deleteMutation.mutate(item.goal._id);
                    }
                  }}
                  busy={statusMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ResponsiveFormDialog
        open={formOpen}
        onOpenChange={(open) => !open && closeForm()}
        title={
          preview
            ? 'Revisá la estimación'
            : editing
              ? 'Editar objetivo'
              : 'Nuevo objetivo'
        }
        description={
          preview
            ? 'Nada se guardará hasta que confirmes.'
            : 'Definí la meta y el capital que querés considerar.'
        }
        desktopClassName="sm:max-w-xl!"
      >
        {preview ? (
          <PreviewStep
            preview={preview}
            currency={form.currency}
            onBack={() => setPreview(null)}
            onConfirm={() => saveMutation.mutate()}
            saving={saveMutation.isPending}
          />
        ) : (
          <GoalForm
            form={form}
            setForm={setForm}
            holdings={holdingsQuery.data?.holdings ?? []}
            boardCurrency={everydayBoard.baseCurrency}
            editing={!!editing}
            loadingHoldings={holdingsQuery.isLoading}
            onPreview={requestPreview}
            onCancel={closeForm}
            previewing={previewMutation.isPending}
          />
        )}
      </ResponsiveFormDialog>
    </div>
  );
}

function SummaryCards({
  summary,
}: {
  summary: {
    total: number;
    achievable: number;
    atRisk: number;
    insufficientData: number;
  };
}) {
  const items = [
    ['Objetivos', summary.total],
    ['Alcanzables', summary.achievable],
    ['En riesgo', summary.atRisk],
    ['Sin datos suficientes', summary.insufficientData],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <Card key={label} className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GoalCard({
  item,
  holdings,
  boardId,
  onEdit,
  onStatus,
  onDelete,
  busy,
}: {
  item: GoalWithResult;
  holdings: Holding[];
  boardId: string;
  onEdit: () => void;
  onStatus: (status: Goal['status']) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const { goal, result, selections } = item;
  const holdingNames = useMemo(
    () => new Map(holdings.map((holding) => [holding._id, holding.name])),
    [holdings],
  );
  const notComputable = result.holdingContributions.filter(
    (contribution) => !contribution.computable,
  );

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl" aria-hidden="true">
                {goal.icon || '🎯'}
              </span>
              <span className="truncate">{goal.name}</span>
            </CardTitle>
            <CardDescription>
              Meta: {money(goal.targetAmount, goal.currency)} · Prioridad{' '}
              {goal.priority}
            </CardDescription>
          </div>
          <Badge variant={goal.status === 'active' ? 'secondary' : 'outline'}>
            {statusLabel(goal.status)}
          </Badge>
        </div>
        <div
          className="flex flex-wrap gap-2"
          aria-label="Viabilidad del objetivo"
        >
          <ViabilityBadge label="Individual" value={result.viableIndividual} />
          <ViabilityBadge label="Conjunta" value={result.viableJoint} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric
            label="Capital individual"
            value={money(
              result.currentComputableValueIndividual,
              goal.currency,
            )}
          />
          <Metric
            label="Avance individual"
            value={progressPercentLabel(
              result.currentComputableValueIndividual,
              goal.targetAmount,
            )}
          />
          <Metric
            label="Capital conjunto"
            value={money(result.currentComputableValueJoint, goal.currency)}
          />
          <Metric
            label="Avance conjunto"
            value={progressPercentLabel(
              result.currentComputableValueJoint,
              goal.targetAmount,
            )}
          />
          <Metric
            label="Falta (conjunto)"
            value={money(result.remainingAmountJoint, goal.currency)}
          />
          <Metric
            label="Aporte mensual"
            value={nullableMoney(
              result.requiredMonthlyContributionJoint,
              goal.currency,
            )}
          />
          {goal.targetDate ? (
            <Metric
              label="Fecha objetivo"
              value={formatYearMonth(goal.targetDate.slice(0, 7))}
            />
          ) : null}
          <Metric
            label="Fecha estimada"
            value={formatYearMonth(result.estimatedCompletionYearMonthJoint)}
          />
          <Metric
            label="Tenencias incluidas"
            value={String(selections.length)}
          />
        </div>
        {goal.targetDate && result.estimatedCompletionYearMonthJoint ? (
          <p className="text-xs text-muted-foreground">
            {estimatedVsTargetNote(
              result.estimatedCompletionYearMonthJoint,
              goal.targetDate.slice(0, 7),
            )}
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Capital considerado
          </p>
          {result.holdingContributions.length ? (
            result.holdingContributions.map((contribution) => (
              <div
                key={contribution.holdingId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate">
                  {holdingNames.get(contribution.holdingId) ??
                    'Tenencia no disponible'}
                </span>
                {contribution.computable ? (
                  <span className="shrink-0 tabular-nums">
                    {nullableMoney(
                      contribution.valueInGoalCurrencyIndividual,
                      goal.currency,
                    )}
                    {contribution.isEstimated ? ' estimado' : ''}
                  </span>
                ) : (
                  <Badge variant="outline">No computable</Badge>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No seleccionaste tenencias.
            </p>
          )}
          {notComputable.length > 0 ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Hay{' '}
              {notComputable.length === 1
                ? 'una tenencia'
                : `${notComputable.length} tenencias`}{' '}
              cuya moneda no puede computarse sin una cotización estimada.
            </p>
          ) : null}
        </div>

        <GoalProgress
          boardId={boardId}
          goalId={goal._id}
          currency={goal.currency}
        />

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
            <Edit3 className="size-4" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onStatus(goal.status === 'paused' ? 'active' : 'paused')
            }
            disabled={busy || goal.status === 'completed'}
          >
            {goal.status === 'paused' ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
            {goal.status === 'paused' ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatus('archived')}
            disabled={busy}
          >
            <Archive className="size-4" /> Archivar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalProgress({
  boardId,
  goalId,
  currency,
}: {
  boardId: string;
  goalId: string;
  currency: string;
}) {
  const progressQuery = useQuery({
    queryKey: ['goal-progress', boardId, goalId],
    queryFn: () => goalsService.getProgress(boardId, goalId),
  });
  if (progressQuery.isLoading) return <Skeleton className="h-16 rounded-xl" />;
  if (progressQuery.isError) {
    return (
      <p className="text-xs text-muted-foreground">
        No se pudo cargar el avance mensual.
      </p>
    );
  }
  const progress = progressQuery.data!;
  if (!progress.hasEnoughData) {
    return (
      <div className="rounded-xl border border-dashed p-3">
        <p className="text-xs font-medium">Avance mensual</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {progress.message ??
            'Todavía no tenemos suficientes mediciones para evaluar el avance mensual.'}
        </p>
      </div>
    );
  }
  const latest = progress.months.at(-1);
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">Avance mensual</p>
        <Badge variant={latest?.met ? 'secondary' : 'outline'}>
          {progress.monthsMet} cumplidos · {progress.monthsMissed} pendientes
        </Badge>
      </div>
      {latest ? (
        <p className="mt-2 text-sm">
          {formatYearMonth(latest.yearMonth)}:{' '}
          {money(latest.observedAdvance, currency)} observado vs.{' '}
          {money(latest.expectedAdvance, currency)} esperado.
        </p>
      ) : null}
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {progress.note}
      </p>
    </div>
  );
}

function GoalForm({
  form,
  setForm,
  holdings,
  boardCurrency,
  editing,
  loadingHoldings,
  onPreview,
  onCancel,
  previewing,
}: {
  form: GoalFormState;
  setForm: React.Dispatch<React.SetStateAction<GoalFormState>>;
  holdings: Holding[];
  boardCurrency: string;
  editing: boolean;
  loadingHoldings: boolean;
  onPreview: () => void;
  onCancel: () => void;
  previewing: boolean;
}) {
  const selected = new Map(
    form.holdingSelections.map((item) => [item.holdingId, item]),
  );
  const update = <K extends keyof GoalFormState>(
    key: K,
    value: GoalFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const toggleHolding = (holdingId: string, checked: boolean) => {
    update(
      'holdingSelections',
      checked
        ? [...form.holdingSelections, { holdingId, useEstimatedFx: false }]
        : form.holdingSelections.filter((item) => item.holdingId !== holdingId),
    );
  };

  const toggleHoldingFx = (holdingId: string, checked: boolean) => {
    update(
      'holdingSelections',
      form.holdingSelections.map((item) =>
        item.holdingId === holdingId
          ? { ...item, useEstimatedFx: checked }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <Field label="Nombre">
        <Input
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Ej: Fondo de emergencia"
          maxLength={100}
        />
      </Field>

      <Field label="Ícono">
        <div
          className="grid grid-cols-6 place-items-center gap-2"
          role="group"
          aria-label="Elegí un ícono"
        >
          {[...GOAL_ICONS, ...getCustomIcons(form.icon)].map((icon) => (
            <button
              key={icon}
              type="button"
              aria-label={`Usar ícono ${icon}`}
              aria-pressed={form.icon === icon}
              onClick={() => update('icon', icon)}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl border text-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                form.icon === icon &&
                  'border-primary bg-primary/10 ring-1 ring-primary',
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monto objetivo">
          <MoneyInput
            value={form.targetAmount}
            onChange={(value) => update('targetAmount', value)}
            currency={form.currency}
            aria-label="Monto objetivo"
          />
        </Field>
        <Field label="Moneda">
          <Select
            value={form.currency}
            onValueChange={(value) => update('currency', value)}
            disabled={editing}
          >
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
          {editing ? (
            <p className="text-[11px] text-muted-foreground">
              La moneda no puede cambiarse después de crear el objetivo.
            </p>
          ) : null}
        </Field>
      </div>

      <Field label="Cómo querés planificarlo">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={form.planningMode === 'date' ? 'default' : 'outline'}
            onClick={() => update('planningMode', 'date')}
            disabled={editing && form.planningMode !== 'date'}
          >
            <CalendarDays className="size-4" /> Fecha objetivo
          </Button>
          <Button
            type="button"
            variant={
              form.planningMode === 'contribution' ? 'default' : 'outline'
            }
            onClick={() => update('planningMode', 'contribution')}
            disabled={editing && form.planningMode !== 'contribution'}
          >
            <CircleDollarSign className="size-4" /> Aporte mensual
          </Button>
        </div>
      </Field>

      {form.planningMode === 'date' ? (
        <Field label="Fecha objetivo">
          <Input
            type="date"
            value={form.targetDate}
            onChange={(event) => update('targetDate', event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            aria-label="Fecha objetivo"
          />
        </Field>
      ) : (
        <Field label="Aporte mensual deseado">
          <MoneyInput
            value={form.desiredMonthlyContribution}
            onChange={(value) => update('desiredMonthlyContribution', value)}
            currency={form.currency}
            aria-label="Aporte mensual deseado"
          />
        </Field>
      )}

      <Field label={`Prioridad: ${form.priority}`}>
        <Input
          type="range"
          min="1"
          max="10"
          value={form.priority}
          onChange={(event) => update('priority', event.target.value)}
          aria-label="Prioridad"
        />
        <p className="text-[11px] text-muted-foreground">
          1 recibe capacidad antes que 10 cuando varios objetivos compiten.
        </p>
      </Field>

      {form.currency !== boardCurrency ? (
        <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
          <Checkbox
            checked={form.useEstimatedFxForForecast}
            onCheckedChange={(checked) =>
              update('useEstimatedFxForForecast', checked === true)
            }
            aria-label="Usar cotización estimada para la capacidad mensual"
          />
          <span>
            <strong className="block font-medium">
              Usar cotización estimada para la capacidad mensual
            </strong>
            <span className="text-xs text-muted-foreground">
              Convierte de {boardCurrency} a {form.currency}; si no, la
              viabilidad futura se mostrará como no computable.
            </span>
          </span>
        </label>
      ) : null}

      <div className="space-y-3">
        <div>
          <Label>Tenencias consideradas</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Seleccionarlas no reserva ni bloquea su saldo.
          </p>
        </div>
        {loadingHoldings ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : holdings.length === 0 ? (
          <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            No hay tenencias disponibles. Podés crear el objetivo igualmente.
          </p>
        ) : (
          holdings.map((holding) => {
            const selection = selected.get(holding._id);
            const currencyMismatch = holding.currency !== form.currency;
            return (
              <div key={holding._id} className="rounded-xl border p-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={!!selection}
                    onCheckedChange={(checked) =>
                      toggleHolding(holding._id, checked === true)
                    }
                    aria-label={`Incluir ${holding.name}`}
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-medium">
                      {holding.name}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {money(holding.currentBalance, holding.currency)}
                    </span>
                  </span>
                </label>
                {selection && currencyMismatch ? (
                  <label className="mt-3 flex cursor-pointer items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <Checkbox
                      checked={selection.useEstimatedFx ?? false}
                      onCheckedChange={(checked) =>
                        toggleHoldingFx(holding._id, checked === true)
                      }
                      aria-label={`Usar cotización estimada para ${holding.name}`}
                    />
                    Usar cotización estimada de {holding.currency} a{' '}
                    {form.currency}
                  </label>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {ESTIMATE_NOTICE}
      </p>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={onPreview} disabled={previewing}>
          {previewing ? 'Calculando…' : 'Ver estimación'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={previewing}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function PreviewStep({
  preview,
  currency,
  onBack,
  onConfirm,
  saving,
}: {
  preview: GoalPreviewResponse;
  currency: string;
  onBack: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const result = preview.candidate;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Capital actual"
          value={money(result.currentComputableValueJoint, currency)}
        />
        <Metric
          label="Monto faltante"
          value={money(result.remainingAmountJoint, currency)}
        />
        <Metric
          label="Aporte mensual necesario"
          value={nullableMoney(
            result.requiredMonthlyContributionJoint,
            currency,
          )}
        />
        <Metric
          label="Ahorro mensual posible"
          value={nullableMoney(result.averageMonthlyCapacity, currency)}
        />
        <Metric
          label="Diferencia mensual"
          value={monthlyCapacityDifference(
            result.averageMonthlyCapacity,
            result.requiredMonthlyContributionJoint,
            currency,
          )}
        />
        <Metric
          label="Fecha estimada"
          value={formatYearMonth(result.estimatedCompletionYearMonthJoint)}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        El ahorro mensual posible es el promedio de tu restante proyectado
        positivo durante el plazo del objetivo, expresado en {currency}.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Viabilidad</p>
        <div className="flex flex-wrap gap-2">
          <ViabilityBadge label="Individual" value={result.viableIndividual} />
          <ViabilityBadge label="Conjunta" value={result.viableJoint} />
        </div>
      </div>
      {preview.affectedGoals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Objetivos afectados</p>
          {preview.affectedGoals.map((affected) => (
            <div
              key={affected.goalId}
              className="rounded-xl border p-3 text-sm"
            >
              <p className="font-medium">{affected.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Antes: {viabilityText(affected.before.viableJoint)} · Nuevo:{' '}
                {viabilityText(affected.after.viableJoint)}
              </p>
              <p className="text-xs text-muted-foreground">
                Fecha anterior:{' '}
                {formatYearMonth(
                  affected.before.estimatedCompletionYearMonthJoint,
                )}{' '}
                · Nueva:{' '}
                {formatYearMonth(
                  affected.after.estimatedCompletionYearMonthJoint,
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          Este cambio no altera la viabilidad conjunta de otros objetivos.
        </p>
      )}
      <p className="rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {ESTIMATE_NOTICE}
      </p>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onConfirm} disabled={saving}>
          {saving ? 'Guardando…' : 'Confirmar y guardar'}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Volver
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ViabilityBadge({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  return (
    <Badge
      variant={
        value === false
          ? 'destructive'
          : value === true
            ? 'secondary'
            : 'outline'
      }
    >
      {label}: {viabilityText(value)}
    </Badge>
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

function CenteredState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Target className="size-7" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function buildPreviewInput(
  form: GoalFormState,
  editing: GoalWithResult | null,
) {
  return {
    ...(editing
      ? { goalId: editing.goal._id, status: editing.goal.status }
      : {}),
    name: form.name.trim(),
    icon: form.icon.trim() || undefined,
    targetAmount: parseMoneyInput(form.targetAmount)!,
    currency: form.currency,
    targetDate: form.planningMode === 'date' ? form.targetDate : undefined,
    desiredMonthlyContribution:
      form.planningMode === 'contribution'
        ? (parseMoneyInput(form.desiredMonthlyContribution) ?? undefined)
        : undefined,
    priority: Number(form.priority),
    useEstimatedFxForForecast: form.useEstimatedFxForForecast,
    holdingSelections: form.holdingSelections,
  };
}

function validateForm(form: GoalFormState) {
  if (form.name.trim().length < 2)
    return 'El nombre debe tener al menos 2 caracteres';
  const target = parseMoneyInput(form.targetAmount);
  if (!target || target <= 0) return 'Ingresá un monto objetivo válido';
  if (form.planningMode === 'date' && !form.targetDate)
    return 'Elegí una fecha objetivo';
  if (form.planningMode === 'contribution') {
    const contribution = parseMoneyInput(form.desiredMonthlyContribution);
    if (!contribution || contribution <= 0)
      return 'Ingresá un aporte mensual válido';
  }
  return null;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function nullableMoney(value: number | null, currency: string) {
  return value === null ? 'No computable' : money(value, currency);
}

/**
 * Percent of the target reached by a given capital figure. Individual and
 * joint are always shown side by side (never a single bar) so a shared
 * holding never reads as "100% reached" twice at once.
 */
function progressPercentLabel(current: number, target: number) {
  if (target <= 0) return '—';
  const percent = Math.min(100, Math.max(0, (current / target) * 100));
  return `${percent.toFixed(0)}%`;
}

function monthlyCapacityDifference(
  capacity: number | null,
  required: number | null,
  currency: string,
) {
  if (capacity === null || required === null) return 'No computable';
  const difference = capacity - required;
  return difference >= 0
    ? `+ ${money(difference, currency)} de margen`
    : `${money(Math.abs(difference), currency)} por cubrir`;
}

function formatYearMonth(value: string | null) {
  if (!value) return 'No estimable';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * "Fecha estimada" and "Fecha objetivo" are different concepts on purpose:
 * the target date is what you set, the estimate is the planner's own
 * projection at your current pace — which can land earlier (a strong month
 * let you get ahead) as easily as later (a weak one put you behind). Shown
 * side by side without this note, an earlier estimate reads as a bug.
 */
function estimatedVsTargetNote(
  estimatedYearMonth: string,
  targetYearMonth: string,
) {
  if (estimatedYearMonth < targetYearMonth) {
    return 'Vas adelantado: a este ritmo, lo alcanzarías antes de tu fecha objetivo.';
  }
  if (estimatedYearMonth > targetYearMonth) {
    return 'Vas atrasado respecto a tu fecha objetivo con el ritmo actual.';
  }
  return 'Vas exactamente al ritmo de tu fecha objetivo.';
}

function statusLabel(status: Goal['status']) {
  return {
    active: 'Activo',
    paused: 'Pausado',
    completed: 'Completado',
    archived: 'Archivado',
  }[status];
}

function viabilityText(value: boolean | null) {
  return value === true
    ? 'Alcanzable'
    : value === false
      ? 'En riesgo'
      : 'Sin datos';
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'No se pudo completar la operación';
}

function getCustomIcons(icon: string) {
  return icon && !(GOAL_ICONS as readonly string[]).includes(icon)
    ? [icon]
    : [];
}
