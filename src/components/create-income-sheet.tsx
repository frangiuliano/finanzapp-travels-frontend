import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { incomesService } from '@/services/incomesService';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@/constants/currencies';

interface CreateIncomeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  currency: string;
  onSuccess?: () => void;
}

interface FormErrors {
  label?: string;
  amount?: string;
}

export function CreateIncomeSheet({
  open,
  onOpenChange,
  boardId,
  currency,
  onSuccess,
}: CreateIncomeSheetProps) {
  const [label, setLabel] = useState('Sueldo');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setLabel('Sueldo');
      setAmount('');
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!label.trim()) {
      newErrors.label = 'El concepto es obligatorio';
    } else if (label.trim().length > 200) {
      newErrors.label = 'Máximo 200 caracteres';
    }

    if (!amount.trim()) {
      newErrors.amount = 'El monto es obligatorio';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0.01) {
        newErrors.amount = 'Ingresá un monto válido (mín. 0.01)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await incomesService.createIncome({
        boardId,
        label: label.trim(),
        amount: parseFloat(amount),
        currency: (SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
          ? currency
          : DEFAULT_CURRENCY) as SupportedCurrency,
      });
      toast.success('Ingreso registrado');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo registrar el ingreso',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar ingreso"
      description={`Se acreditará en ${currency} para el mes actual.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="income-label">Concepto</Label>
          <Input
            id="income-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Sueldo, freelance…"
            disabled={isLoading}
            autoFocus
          />
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="income-amount">Monto ({currency})</Label>
          <Input
            id="income-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Guardando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  );
}
