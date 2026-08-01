import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { AlertTriangle, Archive, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import {
  CreatePaymentMethodDto,
  PAYMENT_METHOD_KIND_LABELS,
  PAYMENT_METHOD_OWNER_LABELS,
  PaymentMethod,
  PaymentMethodKind,
  PaymentMethodOwnerType,
} from '@/types/payment-method';

interface ManagePaymentMethodsSectionProps {
  boardId: string;
}

interface PaymentMethodFormState {
  ownerType: PaymentMethodOwnerType;
  kind: PaymentMethodKind;
  name: string;
  lastFourDigits: string;
  brand: string;
  closingDay: string;
  dueDay: string;
}

const defaultForm: PaymentMethodFormState = {
  ownerType: 'user',
  kind: 'credit',
  name: '',
  lastFourDigits: '',
  brand: '',
  closingDay: '',
  dueDay: '',
};

function getOwnerLabel(method: PaymentMethod): string {
  if (method.ownerType === 'board') {
    const board = method.tripId;
    if (board && typeof board === 'object') {
      return `Tablero: ${board.name}`;
    }
    return 'Del tablero';
  }

  const user = method.userId;
  if (user && typeof user === 'object') {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  return 'Personal';
}

function formatMethodSummary(method: PaymentMethod): string {
  const parts = [PAYMENT_METHOD_KIND_LABELS[method.kind]];
  if (method.lastFourDigits) {
    parts.push(`•••• ${method.lastFourDigits}`);
  }
  if (method.kind === 'credit' && method.closingDay) {
    parts.push(`cierre día ${method.closingDay}`);
  }
  return parts.join(' · ');
}

export function ManagePaymentMethodsSection({
  boardId,
}: ManagePaymentMethodsSectionProps) {
  const [userMethods, setUserMethods] = useState<PaymentMethod[]>([]);
  const [boardMethods, setBoardMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [formData, setFormData] = useState<PaymentMethodFormState>(defaultForm);
  const [showClosingDayWarning, setShowClosingDayWarning] = useState(false);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userResult, boardResult] = await Promise.all([
        paymentMethodsService.getUserMethods(),
        paymentMethodsService.getByScope(boardId, 'board'),
      ]);
      setUserMethods(
        userResult.paymentMethods.filter((method) => method.isActive),
      );
      setBoardMethods(
        boardResult.paymentMethods.filter((method) => method.isActive),
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al cargar medios de pago',
      );
      setUserMethods([]);
      setBoardMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchMethods();
  }, [fetchMethods]);

  const creditWithoutClosingDay = useMemo(
    () =>
      [...userMethods, ...boardMethods].filter(
        (method) => method.kind === 'credit' && !method.closingDay,
      ),
    [userMethods, boardMethods],
  );

  const openCreate = () => {
    setEditingMethod(null);
    setFormData(defaultForm);
    setShowClosingDayWarning(false);
    setSheetOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      ownerType: method.ownerType,
      kind: method.kind,
      name: method.name,
      lastFourDigits: method.lastFourDigits || '',
      brand: method.brand || '',
      closingDay: method.closingDay ? String(method.closingDay) : '',
      dueDay: method.dueDay ? String(method.dueDay) : '',
    });
    setShowClosingDayWarning(false);
    setSheetOpen(true);
  };

  const buildPayload = (): CreatePaymentMethodDto => {
    const payload: CreatePaymentMethodDto = {
      ownerType: formData.ownerType,
      kind: formData.kind,
      name: formData.name.trim(),
      brand: formData.brand.trim() || undefined,
    };

    if (formData.ownerType === 'board') {
      payload.boardId = boardId;
    }

    if (formData.kind === 'debit' || formData.kind === 'credit') {
      payload.lastFourDigits = formData.lastFourDigits.trim();
    }

    if (formData.kind === 'credit' && formData.closingDay.trim()) {
      payload.closingDay = Number(formData.closingDay);
    }

    if (formData.dueDay.trim()) {
      payload.dueDay = Number(formData.dueDay);
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (
      (formData.kind === 'debit' || formData.kind === 'credit') &&
      !/^\d{4}$/.test(formData.lastFourDigits)
    ) {
      toast.error('Los últimos 4 dígitos deben ser exactamente 4 números');
      return;
    }

    if (formData.kind === 'credit' && formData.closingDay.trim()) {
      const closingDay = Number(formData.closingDay);
      if (closingDay < 1 || closingDay > 28) {
        toast.error('El día de cierre debe estar entre 1 y 28');
        return;
      }
    }

    if (formData.dueDay.trim()) {
      const dueDay = Number(formData.dueDay);
      if (dueDay < 1 || dueDay > 28) {
        toast.error('El día de vencimiento debe estar entre 1 y 28');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingMethod) {
        const updatePayload: Record<string, unknown> = {
          name: formData.name.trim(),
          brand: formData.brand.trim() || undefined,
        };

        if (formData.kind === 'debit' || formData.kind === 'credit') {
          updatePayload.lastFourDigits = formData.lastFourDigits.trim();
        }

        if (formData.kind === 'credit') {
          updatePayload.closingDay = formData.closingDay.trim()
            ? Number(formData.closingDay)
            : undefined;
        }

        updatePayload.dueDay = formData.dueDay.trim()
          ? Number(formData.dueDay)
          : undefined;

        await paymentMethodsService.update(editingMethod._id, updatePayload);
        toast.success('Medio de pago actualizado');
      } else {
        const payload = buildPayload();
        await paymentMethodsService.create(payload);

        if (payload.kind === 'credit' && !payload.closingDay) {
          setShowClosingDayWarning(true);
          toast.success(
            'Medio creado. Podés agregar el día de cierre después.',
          );
        } else {
          toast.success('Medio de pago creado');
          setSheetOpen(false);
        }
      }

      await fetchMethods();

      if (editingMethod) {
        setSheetOpen(false);
        setEditingMethod(null);
        setFormData(defaultForm);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al guardar el medio de pago',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (method: PaymentMethod) => {
    if (
      !confirm(
        `¿Archivar "${method.name}"? No se borran los gastos ya registrados.`,
      )
    ) {
      return;
    }

    try {
      await paymentMethodsService.archive(method._id);
      toast.success('Medio de pago archivado');
      await fetchMethods();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al archivar el medio de pago',
      );
    }
  };

  const renderMethodList = (methods: PaymentMethod[], emptyLabel: string) => {
    if (methods.length === 0) {
      return (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      );
    }

    return (
      <ul className="space-y-2">
        {methods.map((method) => (
          <li
            key={method._id}
            className="flex items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{method.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {PAYMENT_METHOD_OWNER_LABELS[method.ownerType]}
                </Badge>
                {method.kind === 'credit' && !method.closingDay ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] text-amber-700 dark:text-amber-300"
                  >
                    <AlertTriangle className="size-3" />
                    Sin cierre
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatMethodSummary(method)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getOwnerLabel(method)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => openEdit(method)}
                aria-label={`Editar ${method.name}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleArchive(method)}
                aria-label={`Archivar ${method.name}`}
              >
                <Archive className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const requiresDigits =
    formData.kind === 'debit' || formData.kind === 'credit';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Medios de pago</h3>
          <p className="text-sm text-muted-foreground">
            Efectivo, débito y crédito personales o del tablero.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nuevo
        </Button>
      </div>

      {creditWithoutClosingDay.length > 0 ? (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Tarjetas de crédito sin día de cierre</p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
              {creditWithoutClosingDay.length === 1
                ? `"${creditWithoutClosingDay[0].name}" no tiene día de cierre. Podés registrar gastos igual, pero los reportes por ciclo de facturación no estarán disponibles hasta configurarlo.`
                : `${creditWithoutClosingDay.length} tarjetas de crédito no tienen día de cierre. Los gastos se registran igual; configurá el cierre para ver reportes por ciclo.`}
            </p>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando medios…</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Personales
            </h4>
            {renderMethodList(
              userMethods,
              'No tenés medios personales. Creá uno para usarlo en cualquier tablero.',
            )}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Del tablero
            </h4>
            {renderMethodList(
              boardMethods,
              'No hay medios compartidos en este tablero.',
            )}
          </div>
        </div>
      )}

      <ResponsiveFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingMethod(null);
            setShowClosingDayWarning(false);
            setFormData(defaultForm);
          }
        }}
        title={editingMethod ? 'Editar medio de pago' : 'Nuevo medio de pago'}
        description="Los medios personales se comparten entre tableros; los del tablero solo en este."
      >
        <div className="space-y-4">
          {!editingMethod ? (
            <>
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Select
                  value={formData.ownerType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      ownerType: value as PaymentMethodOwnerType,
                    }))
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Personal (mío)</SelectItem>
                    <SelectItem value="board">Del tablero activo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.kind}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      kind: value as PaymentMethodKind,
                      lastFourDigits:
                        value === 'cash' ? '' : prev.lastFourDigits,
                    }))
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="pm-name">Nombre *</Label>
            <Input
              id="pm-name"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ej: Visa Galicia"
              disabled={isSaving}
            />
          </div>

          {requiresDigits ? (
            <div className="space-y-2">
              <Label htmlFor="pm-digits">Últimos 4 dígitos *</Label>
              <Input
                id="pm-digits"
                value={formData.lastFourDigits}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    lastFourDigits: event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4),
                  }))
                }
                placeholder="4242"
                maxLength={4}
                inputMode="numeric"
                disabled={isSaving}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="pm-brand">Marca (opcional)</Label>
            <Input
              id="pm-brand"
              value={formData.brand}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, brand: event.target.value }))
              }
              placeholder="visa"
              disabled={isSaving}
            />
          </div>

          {formData.kind === 'credit' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pm-closing">Día de cierre (opcional)</Label>
                <Input
                  id="pm-closing"
                  type="number"
                  min={1}
                  max={28}
                  value={formData.closingDay}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      closingDay: event.target.value,
                    }))
                  }
                  placeholder="14"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Usado para reportes por ciclo de facturación. Podés omitirlo y
                  configurarlo después; los gastos se registran igual.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pm-due">Día de vencimiento (opcional)</Label>
                <Input
                  id="pm-due"
                  type="number"
                  min={1}
                  max={28}
                  value={formData.dueDay}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDay: event.target.value,
                    }))
                  }
                  placeholder="5"
                  disabled={isSaving}
                />
              </div>
            </>
          ) : null}

          {showClosingDayWarning ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              Guardado sin día de cierre. Editá el medio cuando quieras para
              habilitar reportes por ciclo.
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (showClosingDayWarning) {
                  setSheetOpen(false);
                  setShowClosingDayWarning(false);
                  setFormData(defaultForm);
                  return;
                }
                void handleSubmit();
              }}
              disabled={isSaving}
            >
              {isSaving
                ? 'Guardando…'
                : editingMethod
                  ? 'Actualizar'
                  : showClosingDayWarning
                    ? 'Cerrar'
                    : 'Crear'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveFormSheet>
    </div>
  );
}
