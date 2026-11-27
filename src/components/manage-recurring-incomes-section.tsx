import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { RecurringMonthsChecklist } from '@/components/recurring-months-checklist';
import { formatDaysOfMonth } from '@/lib/format-days-of-month';
import { recurringIncomesService } from '@/services/recurringIncomesService';
import type { RecurringIncome } from '@/types/recurring-income';
import { formatCurrency, getCurrentYearMonth } from '@/lib/utils';

interface ManageRecurringIncomesSectionProps {
  boardId: string;
  currency: string;
}

interface FormState {
  label: string;
  amount: string;
  daysOfMonth: number[];
  amountChangeScope: 'this_month' | 'from_month';
  amountChangeYearMonth: string;
  excludedYearMonths: string[];
}

const emptyForm: FormState = {
  label: 'Sueldo',
  amount: '',
  daysOfMonth: [1],
  amountChangeScope: 'from_month',
  amountChangeYearMonth: getCurrentYearMonth(),
  excludedYearMonths: [],
};

export function ManageRecurringIncomesSection({
  boardId,
  currency,
}: ManageRecurringIncomesSectionProps) {
  const [items, setItems] = useState<RecurringIncome[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringIncome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringIncome | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { recurringIncomes } =
        await recurringIncomesService.getAll(boardId);
      setItems(recurringIncomes);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al cargar ingresos recurrentes',
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const openEdit = (item: RecurringIncome) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      amount: formatMoneyInputFromNumber(item.amount),
      daysOfMonth: item.daysOfMonth,
      amountChangeScope: 'from_month',
      amountChangeYearMonth: getCurrentYearMonth(),
      excludedYearMonths: item.excludedYearMonths ?? [],
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingItem) return;
    if (!formData.label.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }
    const amount = parseMoneyInput(formData.amount);
    if (amount === null || amount < 0.01) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (formData.daysOfMonth.length === 0) {
      toast.error('Seleccioná al menos un día del mes');
      return;
    }
    if (!formData.amountChangeYearMonth) {
      toast.error('Seleccioná el mes en que comienza el cambio');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        label: formData.label.trim(),
        amount,
        currency,
        daysOfMonth: formData.daysOfMonth,
        amountChangeScope: formData.amountChangeScope,
        amountChangeYearMonth: formData.amountChangeYearMonth,
        excludedYearMonths: formData.excludedYearMonths,
      };

      await recurringIncomesService.update(editingItem._id, payload);
      toast.success('Ingreso recurrente actualizado');

      setSheetOpen(false);
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al guardar ingreso recurrente',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: RecurringIncome) => {
    setIsDeleting(true);
    try {
      await recurringIncomesService.delete(item._id);
      toast.success('Ingreso recurrente eliminado');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al eliminar ingreso recurrente',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sueldo y otros ingresos que se repiten cada mes en días fijos. Se cargan
        desde el modal de ingreso, en la pestaña "Recurrente"; acá podés
        editarlos o eliminarlos.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no cargaste ingresos recurrentes. Cargalos desde el botón + →
          Ingreso → Recurrente.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
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
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDaysOfMonth(item.daysOfMonth)} ·{' '}
                  {formatCurrency(item.amount, item.currency)}
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
          ))}
        </ul>
      )}

      <ResponsiveFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Editar ingreso recurrente"
        description="Se generan movimientos programados para los próximos 12 meses."
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
          <div className="space-y-2">
            <Label>Monto ({currency})</Label>
            <MoneyInput
              value={formData.amount}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, amount: value }))
              }
              currency={currency}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>Días de acreditación</Label>
            <DayOfMonthPicker
              mode="multiple"
              value={formData.daysOfMonth}
              onChange={(days) =>
                setFormData((prev) => ({ ...prev, daysOfMonth: days }))
              }
              disabled={isSaving}
            />
          </div>
          <div className="space-y-4 rounded-xl border p-3">
            <div className="space-y-2">
              <Label htmlFor="income-change-month">Aplicar en</Label>
              <Input
                id="income-change-month"
                type="month"
                min={getCurrentYearMonth()}
                value={formData.amountChangeYearMonth}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountChangeYearMonth: event.target.value,
                  }))
                }
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Podés programar hoy un cambio de sueldo para un mes futuro.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Alcance del cambio</Label>
              <Select
                value={formData.amountChangeScope}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountChangeScope: value as 'this_month' | 'from_month',
                  }))
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="from_month">
                    Desde el mes elegido
                  </SelectItem>
                  <SelectItem value="this_month">
                    Solo el mes elegido
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <RecurringMonthsChecklist
            excludedYearMonths={formData.excludedYearMonths}
            onChange={(excludedYearMonths) =>
              setFormData((prev) => ({ ...prev, excludedYearMonths }))
            }
            disabled={isSaving}
          />
          <Button
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </ResponsiveFormDialog>

      <DestructiveActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget
            ? `Eliminar “${deleteTarget.label}”`
            : 'Eliminar ingreso recurrente'
        }
        description="Se eliminará la regla recurrente y sus ocurrencias pendientes. Los ingresos que ya confirmaste se conservarán. Esta acción no se puede deshacer."
        confirmLabel="Eliminar recurrencia"
        isPending={isDeleting}
        onConfirm={() => {
          if (deleteTarget) return handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
