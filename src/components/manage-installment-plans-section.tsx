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
import { installmentPlansService } from '@/services/installmentPlansService';
import type { InstallmentPlan } from '@/types/installment-plan';
import { formatCurrency, getCurrentYearMonth } from '@/lib/utils';

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
}

const emptyForm = (yearMonth: string): FormState => ({
  label: '',
  installmentAmount: '',
  totalInstallments: '12',
  paidInstallments: '0',
  startYearMonth: yearMonth,
  dayOfMonth: [10],
});

export function ManageInstallmentPlansSection({
  boardId,
  currency,
}: ManageInstallmentPlansSectionProps) {
  const [items, setItems] = useState<InstallmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallmentPlan | null>(null);
  const [formData, setFormData] = useState<FormState>(
    emptyForm(getCurrentYearMonth()),
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

  const openCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm(getCurrentYearMonth()));
    setSheetOpen(true);
  };

  const openEdit = (item: InstallmentPlan) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      installmentAmount: String(item.installmentAmount),
      totalInstallments: String(item.totalInstallments),
      paidInstallments: String(item.paidInstallments),
      startYearMonth: item.startYearMonth,
      dayOfMonth: [item.dayOfMonth],
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.label.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }

    const installmentAmount = parseFloat(formData.installmentAmount);
    const totalInstallments = parseInt(formData.totalInstallments, 10);
    const paidInstallments = parseInt(formData.paidInstallments, 10);

    if (isNaN(installmentAmount) || installmentAmount < 0.01) {
      toast.error('Ingresá un monto de cuota válido');
      return;
    }
    if (isNaN(totalInstallments) || totalInstallments < 1) {
      toast.error('Cantidad de cuotas inválida');
      return;
    }
    if (isNaN(paidInstallments) || paidInstallments < 0) {
      toast.error('Cuotas pagadas inválidas');
      return;
    }
    if (paidInstallments > totalInstallments) {
      toast.error('Las cuotas pagadas no pueden superar el total');
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
        installmentAmount,
        totalInstallments,
        paidInstallments,
        startYearMonth: formData.startYearMonth,
        dayOfMonth: formData.dayOfMonth[0],
        currency,
      };

      if (editingItem) {
        await installmentPlansService.update(editingItem._id, payload);
        toast.success('Plan de cuotas actualizado');
      } else {
        await installmentPlansService.create({ boardId, ...payload });
        toast.success('Plan de cuotas creado');
      }

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

  const handleDelete = async (item: InstallmentPlan) => {
    if (!confirm(`¿Eliminar el plan "${item.label}"?`)) return;

    try {
      await installmentPlansService.delete(item._id);
      toast.success('Plan de cuotas eliminado');
      await fetchItems();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al eliminar plan de cuotas',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Compras en cuotas con tarjeta para proyectar vencimientos futuros.
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
          No hay planes de cuotas configurados.
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
                  {formatCurrency(item.installmentAmount, item.currency)} ·{' '}
                  {item.paidInstallments}/{item.totalInstallments} cuotas · día{' '}
                  {item.dayOfMonth} · desde {item.startYearMonth}
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
        title={editingItem ? 'Editar plan de cuotas' : 'Nuevo plan de cuotas'}
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
          <div className="space-y-2">
            <Label>Monto por cuota ({currency})</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.installmentAmount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  installmentAmount: e.target.value,
                }))
              }
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Ya pagadas</Label>
              <Input
                type="number"
                min="0"
                value={formData.paidInstallments}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paidInstallments: e.target.value,
                  }))
                }
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Primer mes de cuota</Label>
            <Input
              type="month"
              value={formData.startYearMonth}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startYearMonth: e.target.value,
                }))
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
