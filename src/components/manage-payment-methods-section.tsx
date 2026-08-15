import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  AlertTriangle,
  Archive,
  CalendarRange,
  Pencil,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { notifyPaymentMethodsChanged } from '@/lib/payment-method-events';
import { cn } from '@/lib/utils';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import {
  CreatePaymentMethodDto,
  PAYMENT_METHOD_KIND_LABELS,
  PAYMENT_METHOD_OWNER_LABELS,
  PaymentMethod,
  PaymentMethodKind,
  PaymentMethodOwnerType,
  UpdatePaymentMethodDto,
} from '@/types/payment-method';

interface ManagePaymentMethodsSectionProps {
  boardId: string;
  boardName: string;
}

interface PaymentMethodFormState {
  ownerType: PaymentMethodOwnerType;
  kind: PaymentMethodKind;
  name: string;
  lastFourDigits: string;
  brand: string;
  closingDay: string;
}

const defaultForm: PaymentMethodFormState = {
  ownerType: 'user',
  kind: 'debit',
  name: '',
  lastFourDigits: '',
  brand: '',
  closingDay: '',
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

function formStateFromMethod(method: PaymentMethod): PaymentMethodFormState {
  return {
    ownerType: method.ownerType,
    kind: method.kind,
    name: method.name,
    lastFourDigits: method.lastFourDigits || '',
    brand: method.brand || '',
    closingDay: method.closingDay ? String(method.closingDay) : '',
  };
}

function buildUpdatePayload(
  formData: PaymentMethodFormState,
): UpdatePaymentMethodDto {
  const updatePayload: UpdatePaymentMethodDto = {
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

  return updatePayload;
}

function formatMethodSummary(method: PaymentMethod): string {
  if (method.kind === 'cash') {
    return PAYMENT_METHOD_KIND_LABELS.cash;
  }

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
  boardName,
}: ManagePaymentMethodsSectionProps) {
  const navigate = useNavigate();
  const [userMethods, setUserMethods] = useState<PaymentMethod[]>([]);
  const [boardMethods, setBoardMethods] = useState<PaymentMethod[]>([]);
  const [participantMethods, setParticipantMethods] = useState<PaymentMethod[]>(
    [],
  );
  const [visibilitySavingIds, setVisibilitySavingIds] = useState<Set<string>>(
    () => new Set(),
  );
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
      const [userResult, boardResult, availableResult] = await Promise.all([
        paymentMethodsService.getByScope(boardId, 'user'),
        paymentMethodsService.getByScope(boardId, 'board'),
        paymentMethodsService.getAvailableForBoard(boardId),
      ]);
      setUserMethods(
        userResult.paymentMethods.filter((method) => method.isActive),
      );
      setBoardMethods(
        boardResult.paymentMethods.filter((method) => method.isActive),
      );
      const ownIds = new Set(
        userResult.paymentMethods.map((method) => method._id),
      );
      setParticipantMethods(
        availableResult.paymentMethods.filter(
          (method) =>
            method.isActive &&
            method.ownerType === 'user' &&
            !ownIds.has(method._id),
        ),
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al cargar medios de pago',
      );
      setUserMethods([]);
      setBoardMethods([]);
      setParticipantMethods([]);
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
    setFormData(formStateFromMethod(method));
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

    setIsSaving(true);
    const wasPendingClosingDay = showClosingDayWarning;
    try {
      if (editingMethod) {
        await paymentMethodsService.update(
          editingMethod._id,
          buildUpdatePayload(formData),
        );
        toast.success('Medio de pago actualizado');
        await fetchMethods();
        notifyPaymentMethodsChanged(boardId);

        if (!wasPendingClosingDay || formData.closingDay.trim()) {
          setSheetOpen(false);
          setEditingMethod(null);
          setShowClosingDayWarning(false);
          setFormData(defaultForm);
        }
      } else {
        const payload = buildPayload();
        const { paymentMethod } = await paymentMethodsService.create(payload);

        if (payload.kind === 'credit' && !payload.closingDay) {
          setEditingMethod(paymentMethod);
          setFormData(formStateFromMethod(paymentMethod));
          setShowClosingDayWarning(true);
          toast.success(
            'Medio creado. Podés agregar el día de cierre ahora o cerrar.',
          );
        } else {
          toast.success('Medio de pago creado');
          setSheetOpen(false);
          setEditingMethod(null);
          setFormData(defaultForm);
        }

        await fetchMethods();
        notifyPaymentMethodsChanged(boardId);
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
    if (method.isDefault) {
      return;
    }

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
      notifyPaymentMethodsChanged(boardId);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al archivar el medio de pago',
      );
    }
  };

  const handleVisibilityChange = async (
    method: PaymentMethod,
    enabled: boolean,
  ) => {
    setVisibilitySavingIds((current) => new Set(current).add(method._id));
    setUserMethods((current) =>
      current.map((item) =>
        item._id === method._id ? { ...item, enabled } : item,
      ),
    );
    try {
      await paymentMethodsService.setBoardVisibility(
        method._id,
        boardId,
        enabled,
      );
      toast.success(
        enabled
          ? `${method.name} ya está disponible en ${boardName}`
          : `${method.name} dejó de estar disponible en ${boardName}`,
      );
      await fetchMethods();
      notifyPaymentMethodsChanged(boardId);
    } catch (error) {
      setUserMethods((current) =>
        current.map((item) =>
          item._id === method._id ? { ...item, enabled: method.enabled } : item,
        ),
      );
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo cambiar la disponibilidad',
      );
    } finally {
      setVisibilitySavingIds((current) => {
        const next = new Set(current);
        next.delete(method._id);
        return next;
      });
    }
  };

  const renderMethodList = (
    methods: PaymentMethod[],
    emptyLabel: string,
    options: { editable?: boolean; toggleVisibility?: boolean } = {},
  ) => {
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
                {method.isDefault ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Predeterminado
                  </Badge>
                ) : null}
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
              {options.toggleVisibility ? (
                <p className="text-xs text-muted-foreground">
                  {method.enabled !== false
                    ? `Disponible en ${boardName}`
                    : `No disponible en ${boardName}`}
                </p>
              ) : method.ownerType === 'user' ? (
                <p className="text-xs text-muted-foreground">
                  Disponible en este tablero
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {options.toggleVisibility ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={method.enabled !== false}
                  aria-label={`Usar ${method.name} en ${boardName}`}
                  disabled={visibilitySavingIds.has(method._id)}
                  onClick={() =>
                    void handleVisibilityChange(
                      method,
                      method.enabled === false,
                    )
                  }
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                    method.enabled !== false
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform',
                      method.enabled !== false
                        ? 'translate-x-5'
                        : 'translate-x-0',
                    )}
                  />
                </button>
              ) : null}
              {options.editable &&
              method.kind === 'credit' &&
              method.closingDay ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    navigate(
                      `/billing-periods/confirm?paymentMethodId=${method._id}&mode=manage`,
                    )
                  }
                  aria-label={`Gestionar ciclos de ${method.name}`}
                >
                  <CalendarRange className="size-4" />
                </Button>
              ) : null}
              {options.editable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => openEdit(method)}
                  aria-label={`Editar ${method.name}`}
                  disabled={method.isDefault}
                >
                  <Pencil className="size-4" />
                </Button>
              ) : null}
              {options.editable && !method.isDefault ? (
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
              ) : null}
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
            Tarjetas de débito y crédito personales o del tablero. Efectivo /
            Transferencia viene incluido en cada tablero.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nuevo
        </Button>
      </div>

      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          Tablero activo:{' '}
          <span className="font-medium text-foreground">{boardName}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Los medios del tablero se crean en este tablero. Cambiá el tablero
          activo desde el selector del encabezado para configurar otro.
        </p>
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
              Medios del tablero
            </h4>
            {renderMethodList(
              boardMethods,
              'No hay medios compartidos en este tablero.',
              { editable: true },
            )}
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Mis medios personales
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                El medio sigue siendo personal. Elegí si querés usarlo en{' '}
                {boardName}.
              </p>
            </div>
            {renderMethodList(
              userMethods,
              'No tenés medios personales. Creá uno para usarlo en cualquier tablero.',
              { editable: true, toggleVisibility: true },
            )}
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Medios de otros participantes
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Solo cada propietario puede cambiar su disponibilidad.
              </p>
            </div>
            {renderMethodList(
              participantMethods,
              'Los demás participantes no tienen medios disponibles en este tablero.',
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
        title={
          showClosingDayWarning && editingMethod
            ? 'Agregar día de cierre'
            : editingMethod
              ? 'Editar medio de pago'
              : 'Nuevo medio de pago'
        }
        description={
          showClosingDayWarning && editingMethod
            ? 'El medio ya fue creado. Completá el día de cierre o cerrá para hacerlo después.'
            : 'Los medios personales se comparten entre tableros; los del tablero solo en este.'
        }
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
                    <SelectItem value="board">
                      Del tablero: {boardName}
                    </SelectItem>
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
                      lastFourDigits: prev.lastFourDigits,
                    }))
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  Día del mes en que cierra el resumen (ej. 14 = cierra todos
                  los meses el día 14). Se configura una vez; el sistema calcula
                  cada ciclo automáticamente.
                </p>
              </div>
            </>
          ) : null}

          {showClosingDayWarning ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              Guardado sin día de cierre. Completá el campo de abajo y guardá, o
              cerrá para configurarlo más tarde.
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (showClosingDayWarning && editingMethod) {
                  if (formData.closingDay.trim()) {
                    void handleSubmit();
                    return;
                  }
                  setSheetOpen(false);
                  setShowClosingDayWarning(false);
                  setEditingMethod(null);
                  setFormData(defaultForm);
                  return;
                }
                void handleSubmit();
              }}
              disabled={isSaving}
            >
              {isSaving
                ? 'Guardando…'
                : showClosingDayWarning && editingMethod
                  ? formData.closingDay.trim()
                    ? 'Guardar cierre'
                    : 'Cerrar'
                  : editingMethod
                    ? 'Actualizar'
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
