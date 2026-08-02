import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { recurringExpensesService } from '@/services/recurringExpensesService';
import type { RecurringExpense } from '@/types/recurring-expense';
import { formatCurrency } from '@/lib/utils';

interface ManageRecurringExpensesSectionProps {
  boardId: string;
  currency: string;
}

interface FormState {
  label: string;
  amount: string;
  dayOfMonth: number[];
}

const emptyForm: FormState = {
  label: '',
  amount: '',
  dayOfMonth: [1],
};

export function ManageRecurringExpensesSection({
  boardId,
  currency,
}: ManageRecurringExpensesSectionProps) {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { recurringExpenses } =
        await recurringExpensesService.getAll(boardId);
      setItems(recurringExpenses);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al cargar gastos fijos',
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

  const openEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      amount: formatMoneyInputFromNumber(item.amount),
      dayOfMonth: [item.dayOfMonth],
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }
    const amount = parseMoneyInput(formData.amount);
    if (amount === null || amount < 0.01) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (formData.dayOfMonth.length === 0) {
      toast.error('Seleccioná el día del mes');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        label: formData.label.trim(),
        amount,
        currency,
        dayOfMonth: formData.dayOfMonth[0],
      };

      if (editingItem) {
        await recurringExpensesService.update(editingItem._id, payload);
        toast.success('Gasto fijo actualizado');
      } else {
        await recurringExpensesService.create({ boardId, ...payload });
        toast.success('Gasto fijo creado');
      }

      setSheetOpen(false);
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al guardar gasto fijo',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: RecurringExpense) => {
    if (!confirm(`¿Eliminar el gasto fijo "${item.label}"?`)) return;

    try {
      await recurringExpensesService.delete(item._id);
      toast.success('Gasto fijo eliminado');
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al eliminar gasto fijo',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Alquiler, servicios y otros compromisos mensuales para proyectar meses
          futuros.
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
          No hay gastos fijos configurados.
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
                  Día {item.dayOfMonth} ·{' '}
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
        title={editingItem ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
        description="Se proyectará cada mes en el día elegido."
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
              disabled={isSaving}
            />
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
