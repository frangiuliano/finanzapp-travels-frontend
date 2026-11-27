import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Archive, Pencil, Plus, Upload } from 'lucide-react';
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
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import { PaymentMethodInstitutionField } from '@/components/payment-method-institution-field';
import { notifyPaymentMethodsChanged } from '@/lib/payment-method-events';
import { cn } from '@/lib/utils';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import { useAuthStore } from '@/store/authStore';
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
  institution: string;
  institutionCode: string;
  lastFourDigits: string;
  brand: string;
}

const defaultForm: PaymentMethodFormState = {
  ownerType: 'user',
  kind: 'debit',
  name: '',
  institution: '',
  institutionCode: '',
  lastFourDigits: '',
  brand: '',
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
    institution: method.institution || '',
    institutionCode: method.institutionCode || '',
    lastFourDigits: method.lastFourDigits || '',
    brand: method.brand || '',
  };
}

function buildUpdatePayload(
  formData: PaymentMethodFormState,
): UpdatePaymentMethodDto {
  const updatePayload: UpdatePaymentMethodDto = {
    name: formData.name.trim(),
    institution: formData.institution.trim(),
    institutionCode: formData.institutionCode || null,
    brand: formData.brand.trim() || undefined,
  };

  if (formData.kind === 'debit' || formData.kind === 'credit') {
    updatePayload.lastFourDigits = formData.lastFourDigits.trim();
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
  return parts.join(' · ');
}

export function ManagePaymentMethodsSection({
  boardId,
  boardName,
}: ManagePaymentMethodsSectionProps) {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
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
  const [archiveTarget, setArchiveTarget] = useState<PaymentMethod | null>(
    null,
  );
  const [isArchiving, setIsArchiving] = useState(false);
  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const [participantResult, boardResult] = await Promise.all([
        paymentMethodsService.getBoardParticipantMethods(boardId),
        paymentMethodsService.getByScope(boardId, 'board'),
      ]);
      const activeParticipantMethods = participantResult.paymentMethods.filter(
        (method) => method.isActive,
      );
      const belongsToCurrentUser = (method: PaymentMethod) => {
        const ownerId =
          typeof method.userId === 'object' ? method.userId._id : method.userId;
        return ownerId === userId;
      };

      const nextUserMethods =
        activeParticipantMethods.filter(belongsToCurrentUser);
      const nextBoardMethods = boardResult.paymentMethods.filter(
        (method) => method.isActive,
      );

      setUserMethods(nextUserMethods);
      setParticipantMethods(
        activeParticipantMethods.filter(
          (method) => !belongsToCurrentUser(method),
        ),
      );
      setBoardMethods(nextBoardMethods);
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
  }, [boardId, userId]);

  useEffect(() => {
    void fetchMethods();
  }, [fetchMethods]);

  const openCreate = () => {
    setEditingMethod(null);
    setFormData(defaultForm);
    setSheetOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData(formStateFromMethod(method));
    setSheetOpen(true);
  };

  const buildPayload = (): CreatePaymentMethodDto => {
    const payload: CreatePaymentMethodDto = {
      ownerType: formData.ownerType,
      kind: formData.kind,
      name: formData.name.trim(),
      institution: formData.institution.trim() || undefined,
      institutionCode: formData.institutionCode || undefined,
      brand: formData.brand.trim() || undefined,
    };

    if (formData.ownerType === 'board') {
      payload.boardId = boardId;
    }

    if (formData.kind === 'debit' || formData.kind === 'credit') {
      payload.lastFourDigits = formData.lastFourDigits.trim();
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

    setIsSaving(true);
    try {
      if (editingMethod) {
        await paymentMethodsService.update(
          editingMethod._id,
          buildUpdatePayload(formData),
        );
        toast.success('Medio de pago actualizado');
        await fetchMethods();
        notifyPaymentMethodsChanged(boardId);

        setSheetOpen(false);
        setEditingMethod(null);
        setFormData(defaultForm);
      } else {
        const payload = buildPayload();
        await paymentMethodsService.create(payload);
        toast.success('Medio de pago creado');
        setSheetOpen(false);
        setEditingMethod(null);
        setFormData(defaultForm);

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
    setIsArchiving(true);
    try {
      await paymentMethodsService.archive(method._id);
      toast.success('Medio de pago archivado');
      setArchiveTarget(null);
      await fetchMethods();
      notifyPaymentMethodsChanged(boardId);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al archivar el medio de pago',
      );
    } finally {
      setIsArchiving(false);
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
            className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
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
              </div>
              <p className="text-xs text-muted-foreground">
                {formatMethodSummary(method)}
              </p>
              {method.institution ? (
                <p className="text-xs text-muted-foreground">
                  {method.institution}
                </p>
              ) : null}
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
                  {method.enabled !== false
                    ? 'Disponible en este tablero'
                    : 'No disponible en este tablero'}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 self-end sm:self-auto">
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
              {options.editable && method.kind === 'credit' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    navigate(`/statement-imports?paymentMethodId=${method._id}`)
                  }
                  aria-label={`Importar resumen de ${method.name}`}
                >
                  <Upload className="size-4" />
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
                  onClick={() => setArchiveTarget(method)}
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
          Viendo:{' '}
          <span className="font-medium text-foreground">{boardName}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Los medios del tablero se crean en este tablero. Cambiá el tablero
          activo desde el selector del encabezado para configurar otro.
        </p>
      </div>

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

      <ResponsiveFormDialog
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingMethod(null);
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

          <PaymentMethodInstitutionField
            idPrefix="pm"
            value={formData.institution}
            institutionCode={formData.institutionCode || undefined}
            onChange={(institutionCode, institution) =>
              setFormData((prev) => ({
                ...prev,
                institution,
                institutionCode: institutionCode || '',
              }))
            }
            disabled={isSaving}
          />

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

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : editingMethod ? 'Actualizar' : 'Crear'}
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
      </ResponsiveFormDialog>

      <DestructiveActionDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={
          archiveTarget
            ? `Archivar “${archiveTarget.name}”`
            : 'Archivar medio de pago'
        }
        description="El medio dejará de estar disponible para registrar nuevos gastos. Los movimientos existentes conservarán su información y no se borrarán."
        confirmLabel="Archivar medio"
        confirmIcon={<Archive className="size-4" aria-hidden />}
        pendingLabel="Archivando…"
        isPending={isArchiving}
        onConfirm={() => {
          if (archiveTarget) return handleArchive(archiveTarget);
        }}
      />
    </div>
  );
}
