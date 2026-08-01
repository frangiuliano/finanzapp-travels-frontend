import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { formatDaysOfMonth } from '@/lib/format-days-of-month';
import { recurringIncomesService } from '@/services/recurringIncomesService';
import type { RecurringIncome } from '@/types/recurring-income';
import { formatCurrency } from '@/lib/utils';

interface ManageRecurringIncomesSectionProps {
  boardId: string;
  currency: string;
}

interface FormState {
  label: string;
  amount: string;
  daysOfMonth: number[];
}

const emptyForm: FormState = {
  label: 'Sueldo',
  amount: '',
  daysOfMonth: [1],
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

  const openCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (item: RecurringIncome) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      amount: String(item.amount),
      daysOfMonth: item.daysOfMonth,
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (formData.daysOfMonth.length === 0) {
      toast.error('Seleccioná al menos un día del mes');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        label: formData.label.trim(),
        amount,
        currency,
        daysOfMonth: formData.daysOfMonth,
      };

      if (editingItem) {
        await recurringIncomesService.update(editingItem._id, payload);
        toast.success('Ingreso recurrente actualizado');
      } else {
        await recurringIncomesService.create({ boardId, ...payload });
        toast.success('Ingreso recurrente creado');
      }

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
    if (!confirm(`¿Eliminar el ingreso recurrente "${item.label}"?`)) return;

    try {
      await recurringIncomesService.delete(item._id);
      toast.success('Ingreso recurrente eliminado');
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al eliminar ingreso recurrente',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sueldo y otros ingresos que se repiten cada mes en días fijos.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay ingresos recurrentes configurados.
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
                  onClick={() => void handleDelete(item)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          editingItem ? 'Editar ingreso recurrente' : 'Nuevo ingreso recurrente'
        }
        description="Se proyectará automáticamente en los meses que navegues."
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
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
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
          <Button
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </ResponsiveFormSheet>
    </div>
  );
}
