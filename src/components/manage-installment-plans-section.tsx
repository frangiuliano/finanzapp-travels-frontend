import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { YearMonthSelector } from '@/components/year-month-selector';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { installmentPlansService } from '@/services/installmentPlansService';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { formatPaymentMethodLabel } from '@/lib/format-payment-method-label';
import type {
  InstallmentOverridePolicy,
  InstallmentPlan,
  InstallmentPlanUpdateNeedsDecision,
  UpdateInstallmentPlanDto,
} from '@/types/installment-plan';
import {
  cn,
  formatCurrency,
  getCurrentYearMonth,
  shiftYearMonth,
} from '@/lib/utils';

const ALL_FILTER = 'all';

interface ManageInstallmentPlansSectionProps {
  boardId: string;
  currency: string;
}

interface FormState {
  label: string;
  installmentAmount: string;
  totalInstallments: string;
  paidInstallments: string;
  startYearMonth: string;
  dayOfMonth: number[];
  categoryId: string;
}

const emptyForm = (yearMonth: string): FormState => ({
  label: '',
  installmentAmount: '',
  totalInstallments: '12',
  paidInstallments: '0',
  startYearMonth: yearMonth,
  dayOfMonth: [10],
  categoryId: '',
});

function getPlanCategoryId(item: InstallmentPlan): string {
  if (!item.categoryId) return '';
  return typeof item.categoryId === 'string'
    ? item.categoryId
    : item.categoryId._id;
}

function getPlanCategoryLabel(item: InstallmentPlan): string | undefined {
  if (!item.categoryId || typeof item.categoryId === 'string') return undefined;
  return item.categoryId.name;
}

function toMonthSlash(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${month}/${year}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

interface PillOption<T extends string> {
  value: T;
  label: string;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            value === option.value
              ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
              : 'border-border text-muted-foreground hover:border-foreground/20',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ManageInstallmentPlansSection({
  boardId,
  currency,
}: ManageInstallmentPlansSectionProps) {
  const { categories } = useBoardCategories(boardId);
  const { paymentMethods } = useAvailablePaymentMethods(boardId);
  const paymentMethodById = useMemo(
    () => new Map(paymentMethods.map((method) => [method._id, method])),
    [paymentMethods],
  );
  const [filterPaymentMethodId, setFilterPaymentMethodId] =
    useState(ALL_FILTER);
  const [filterCategoryId, setFilterCategoryId] = useState(ALL_FILTER);
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallmentPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstallmentPlan | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<FormState>(
    emptyForm(getCurrentYearMonth()),
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDecision, setReviewDecision] =
    useState<InstallmentPlanUpdateNeedsDecision | null>(null);
  const [reviewOverridePolicy, setReviewOverridePolicy] =
    useState<InstallmentOverridePolicy>('preserve');

  const totalInstallmentsForSchedule = Math.min(
    Math.max(parseInt(formData.totalInstallments, 10) || 0, 0),
    120,
  );
  const paidInstallmentsForSchedule = Math.min(
    Math.max(parseInt(formData.paidInstallments, 10) || 0, 0),
    totalInstallmentsForSchedule,
  );
  const schedule = useMemo(
    () =>
      Array.from({ length: totalInstallmentsForSchedule }, (_, index) => ({
        installmentNumber: index + 1,
        yearMonth: shiftYearMonth(formData.startYearMonth, index),
        isPaid: index + 1 <= paidInstallmentsForSchedule,
      })),
    [
      formData.startYearMonth,
      totalInstallmentsForSchedule,
      paidInstallmentsForSchedule,
    ],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (
          filterPaymentMethodId !== ALL_FILTER &&
          item.paymentMethodId !== filterPaymentMethodId
        ) {
          return false;
        }
        if (
          filterCategoryId !== ALL_FILTER &&
          getPlanCategoryId(item) !== filterCategoryId
        ) {
          return false;
        }
        return true;
      }),
    [items, filterPaymentMethodId, filterCategoryId],
  );

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { installmentPlans } =
        await installmentPlansService.getAll(boardId);
      setItems(installmentPlans);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al cargar planes de cuotas',
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const openEdit = (item: InstallmentPlan) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      installmentAmount: formatMoneyInputFromNumber(item.installmentAmount),
      totalInstallments: String(item.totalInstallments),
      paidInstallments: String(item.paidInstallments),
      startYearMonth: item.startYearMonth,
      dayOfMonth: [item.dayOfMonth],
      categoryId: getPlanCategoryId(item),
    });
    setReviewOpen(false);
    setReviewDecision(null);
    setReviewOverridePolicy('preserve');
    setSheetOpen(true);
  };

  const buildBasePayload = (): UpdateInstallmentPlanDto | null => {
    if (!formData.label.trim()) {
      toast.error('El concepto es obligatorio');
      return null;
    }
    const installmentAmount = parseMoneyInput(formData.installmentAmount);
    const totalInstallments = parseInt(formData.totalInstallments, 10);
    if (installmentAmount === null || installmentAmount < 0.01) {
      toast.error('Ingresá un monto de cuota válido');
      return null;
    }
    if (isNaN(totalInstallments) || totalInstallments < 1) {
      toast.error('Cantidad de cuotas inválida');
      return null;
    }
    const paidInstallments = parseInt(formData.paidInstallments, 10) || 0;
    if (paidInstallments < 0 || paidInstallments > totalInstallments) {
      toast.error('Cuotas ya pagadas inválido');
      return null;
    }

    const payload: UpdateInstallmentPlanDto = {
      label: formData.label.trim(),
      installmentAmount,
      totalInstallments,
      paidInstallments,
      startYearMonth: formData.startYearMonth,
      currency,
    };
    if (formData.dayOfMonth.length > 0) {
      payload.dayOfMonth = formData.dayOfMonth[0];
    }
    if (formData.categoryId) {
      payload.categoryId = formData.categoryId;
    }
    return payload;
  };

  const runSave = async (
    decisions?: Pick<UpdateInstallmentPlanDto, 'overridePolicy'>,
  ) => {
    if (!editingItem) return;
    const basePayload = buildBasePayload();
    if (!basePayload) return;

    setIsSaving(true);
    try {
      const result = await installmentPlansService.update(editingItem._id, {
        ...basePayload,
        ...decisions,
      });

      if (result.status === 'needs_decision') {
        setReviewDecision(result);
        setReviewOverridePolicy('preserve');
        setReviewOpen(true);
        return;
      }

      const parts: string[] = [];
      if (result.applied.datesUpdated > 0) {
        parts.push(
          `${result.applied.datesUpdated} ${pluralize(result.applied.datesUpdated, 'fecha corregida', 'fechas corregidas')}`,
        );
      }
      if (result.applied.overridesPreserved > 0) {
        parts.push(
          `${result.applied.overridesPreserved} ${pluralize(result.applied.overridesPreserved, 'cuota con cambios propios conservada', 'cuotas con cambios propios conservadas')}`,
        );
      }
      if (result.applied.overridesReplaced > 0) {
        parts.push(
          `${result.applied.overridesReplaced} ${pluralize(result.applied.overridesReplaced, 'cuota actualizada con el plan', 'cuotas actualizadas con el plan')}`,
        );
      }
      toast.success(
        parts.length > 0
          ? `Plan guardado: ${parts.join(', ')}.`
          : 'Plan de cuotas actualizado',
      );

      setReviewOpen(false);
      setReviewDecision(null);
      setSheetOpen(false);
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al guardar plan de cuotas',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => void runSave();

  const handleConfirmReview = () =>
    void runSave({
      overridePolicy: reviewDecision?.customOverrides
        ? reviewOverridePolicy
        : undefined,
    });

  const handleDelete = async (item: InstallmentPlan) => {
    setIsDeleting(true);
    try {
      await installmentPlansService.delete(item._id);
      toast.success('Plan de cuotas eliminado');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al eliminar plan de cuotas',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compras en cuotas con tarjeta para proyectar vencimientos futuros. Se
        cargan desde el modal de gasto, eligiendo una tarjeta de crédito; acá
        podés editarlas o eliminarlas.
      </p>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterPaymentMethodId}
            onValueChange={setFilterPaymentMethodId}
          >
            <SelectTrigger className="w-auto rounded-xl">
              <SelectValue placeholder="Tarjeta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Todas las tarjetas</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method._id} value={method._id}>
                  {formatPaymentMethodLabel(method)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length > 0 ? (
            <Select
              value={filterCategoryId}
              onValueChange={setFilterCategoryId}
            >
              <SelectTrigger className="w-auto rounded-xl">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no cargaste compras en cuotas. Cargalas desde el botón + →
          Gasto, eligiendo tu tarjeta de crédito.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún plan de cuotas coincide con esos filtros.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {filteredItems.map((item) => {
            const paymentMethod = item.paymentMethodId
              ? paymentMethodById.get(item.paymentMethodId)
              : undefined;
            return (
              <li
                key={item._id}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{item.label}</p>
                    {!item.isActive ? (
                      <Badge variant="secondary">Inactivo</Badge>
                    ) : null}
                    {getPlanCategoryLabel(item) ? (
                      <Badge variant="outline">
                        {getPlanCategoryLabel(item)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.installmentAmount, item.currency)} ·{' '}
                    {item.paidCount}/{item.totalInstallments} pagadas · desde{' '}
                    {item.startYearMonth} ·{' '}
                    {paymentMethod
                      ? formatPaymentMethodLabel(paymentMethod)
                      : 'Sin tarjeta'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Eliminar ${item.label}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ResponsiveFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Editar plan de cuotas"
        description="Las cuotas pendientes se proyectan mes a mes."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Concepto</Label>
            <Input
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              disabled={isSaving}
            />
          </div>
          {categories.length > 0 ? (
            <div className="space-y-2">
              <Label>Categoría</Label>
              <PillGroup
                options={categories.map((category) => ({
                  value: category._id,
                  label: category.name,
                }))}
                value={formData.categoryId}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Monto por cuota ({currency})</Label>
            <MoneyInput
              value={formData.installmentAmount}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  installmentAmount: value,
                }))
              }
              currency={currency}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>Total cuotas</Label>
            <Input
              type="number"
              min="1"
              value={formData.totalInstallments}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  totalInstallments: e.target.value,
                }))
              }
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>Cuotas ya pagadas antes de cargar esto</Label>
            <Input
              type="number"
              min="0"
              max={formData.totalInstallments || undefined}
              value={formData.paidInstallments}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paidInstallments: e.target.value,
                }))
              }
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-[11px]">
              Pagadas en total ahora mismo: {editingItem?.paidCount}/
              {editingItem?.totalInstallments} (incluye las que ya vencieron por
              fecha, además de estas). Corregir este número no afecta a ninguna
              cuota que ya esté marcada como pagada — solo ajusta cuántas se
              asumen pagadas de antes de cargar el plan.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Primer mes de cuota</Label>
            <YearMonthSelector
              yearMonth={formData.startYearMonth}
              onChange={(yearMonth) =>
                setFormData((prev) => ({ ...prev, startYearMonth: yearMonth }))
              }
            />
            {schedule.length > 0 ? (
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border bg-card p-2">
                {schedule.map((entry) => (
                  <span
                    key={entry.installmentNumber}
                    className={cn(
                      'whitespace-nowrap rounded-lg border px-2 py-1 text-[11px]',
                      entry.isPaid
                        ? 'border-transparent bg-muted text-muted-foreground line-through'
                        : 'border-border',
                    )}
                  >
                    {toMonthSlash(entry.yearMonth)} · Cuota{' '}
                    {entry.installmentNumber}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="text-muted-foreground text-[11px]">
              Mover esto solo corre las cuotas que todavía no se pagaron.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Día del mes</Label>
            <DayOfMonthPicker
              mode="single"
              value={formData.dayOfMonth}
              onChange={(days) =>
                setFormData((prev) => ({ ...prev, dayOfMonth: days }))
              }
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-[11px]">
              Es informativo y no cambia el mes de pago de las cuotas.
            </p>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </ResponsiveFormDialog>

      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReviewOpen(false);
            setReviewDecision(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hay cuotas con cambios propios</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {reviewDecision?.customOverrides ? (
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  Hay {reviewDecision.customOverrides.count}{' '}
                  {pluralize(
                    reviewDecision.customOverrides.count,
                    'cuota con cambios propios',
                    'cuotas con cambios propios',
                  )}
                </p>
                <p className="text-muted-foreground text-sm">
                  Tienen un monto o concepto diferente al plan.
                </p>
                <PillGroup
                  options={[
                    {
                      value: 'preserve' as const,
                      label: 'Conservar sus cambios',
                    },
                    {
                      value: 'replace' as const,
                      label: 'Reemplazarlos con los datos del plan',
                    },
                  ]}
                  value={reviewOverridePolicy}
                  onChange={setReviewOverridePolicy}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewOpen(false);
                setReviewDecision(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmReview} disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DestructiveActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget
            ? `Eliminar “${deleteTarget.label}”`
            : 'Eliminar plan de cuotas'
        }
        description="Las cuotas pendientes dejarán de incluirse en las proyecciones. Los movimientos que ya registraste no se modificarán. Esta acción no se puede deshacer."
        confirmLabel="Eliminar plan"
        isPending={isDeleting}
        onConfirm={() => {
          if (deleteTarget) return handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
