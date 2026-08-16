import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
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
  PaymentMethod,
  PaymentMethodKind,
  PaymentMethodOwnerType,
} from '@/types/payment-method';

interface CreatePaymentMethodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
  onCreated?: (paymentMethod: PaymentMethod) => void;
}

interface FormState {
  ownerType: PaymentMethodOwnerType;
  kind: PaymentMethodKind;
  name: string;
  lastFourDigits: string;
  closingDay: string;
}

const defaultForm: FormState = {
  ownerType: 'user',
  kind: 'debit',
  name: '',
  lastFourDigits: '',
  closingDay: '',
};

export function CreatePaymentMethodSheet({
  open,
  onOpenChange,
  boardId,
  boardName,
  onCreated,
}: CreatePaymentMethodSheetProps) {
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(defaultForm);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!/^\d{4}$/.test(formData.lastFourDigits)) {
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

    const payload: CreatePaymentMethodDto = {
      ownerType: formData.ownerType,
      kind: formData.kind,
      name: formData.name.trim(),
      lastFourDigits: formData.lastFourDigits.trim(),
    };

    if (formData.ownerType === 'board') {
      payload.boardId = boardId;
    }

    if (formData.kind === 'credit' && formData.closingDay.trim()) {
      payload.closingDay = Number(formData.closingDay);
    }

    setIsSaving(true);
    try {
      const { paymentMethod } = await paymentMethodsService.create(payload);
      toast.success('Medio de pago creado');
      onCreated?.(paymentMethod);
      onOpenChange(false);
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

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar tarjeta"
      description="Creá un medio de débito o crédito para usarlo al registrar gastos."
    >
      <div className="space-y-4">
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
              <SelectItem value="board">Del tablero: {boardName}</SelectItem>
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

        <div className="space-y-2">
          <Label htmlFor="pm-quick-name">Nombre</Label>
          <Input
            id="pm-quick-name"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Ej: Visa Galicia"
            disabled={isSaving}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pm-quick-digits">Últimos 4 dígitos</Label>
          <Input
            id="pm-quick-digits"
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

        {formData.kind === 'credit' ? (
          <div className="space-y-2">
            <Label htmlFor="pm-quick-closing">Día de cierre (opcional)</Label>
            <Input
              id="pm-quick-closing"
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
              Podés configurarlo después desde Config. tablero.
            </p>
          </div>
        ) : null}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            className="flex-1"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando…' : 'Crear'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </ResponsiveFormSheet>
  );
}
