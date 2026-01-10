import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { budgetsService } from '@/services/budgetsService';
import { Budget } from '@/types/budget';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
} from '@/constants/currencies';

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  budget?: Budget | null;
  onSuccess?: () => void;
}

export function CreateBudgetDialog({
  open,
  onOpenChange,
  tripId,
  budget,
  onSuccess,
}: CreateBudgetDialogProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  useEffect(() => {
    if (budget) {
      setName(budget.name);
      setAmount(budget.amount.toString());
      setCurrency(
        (SUPPORTED_CURRENCIES.includes(budget.currency as SupportedCurrency)
          ? budget.currency
          : DEFAULT_CURRENCY) as SupportedCurrency,
      );
    } else {
      setName('');
      setAmount('');
      setCurrency(DEFAULT_CURRENCY);
    }
    setErrors({});
  }, [budget, open]);

  const validateForm = () => {
    const newErrors: { name?: string; amount?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del presupuesto es obligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (name.trim().length > 100) {
      newErrors.name = 'El nombre no puede tener más de 100 caracteres';
    }

    if (!amount.trim()) {
      newErrors.amount = 'El monto es obligatorio';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        newErrors.amount =
          'El monto debe ser un número válido mayor o igual a 0';
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
      if (budget) {
        await budgetsService.updateBudget(budget._id, {
          name: name.trim(),
          amount: parseFloat(amount),
          currency,
        });
        toast.success('Presupuesto actualizado exitosamente');
      } else {
        await budgetsService.createBudget({
          tripId,
          name: name.trim(),
          amount: parseFloat(amount),
          currency,
        });
        toast.success('Presupuesto creado exitosamente');
      }

      setName('');
      setAmount('');
      setCurrency(DEFAULT_CURRENCY);
      setErrors({});
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: { name?: string; amount?: string };
      }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        (budget
          ? 'Error al actualizar el presupuesto'
          : 'Error al crear el presupuesto');
      toast.error(errorMessage);

      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setAmount('');
      setCurrency(DEFAULT_CURRENCY);
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {budget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
          </DialogTitle>
          <DialogDescription>
            {budget
              ? 'Modifica la información del presupuesto.'
              : 'Completa la información para crear un nuevo presupuesto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Presupuesto *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alojamiento"
              disabled={isLoading}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as SupportedCurrency)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? budget
                  ? 'Actualizando...'
                  : 'Creando...'
                : budget
                  ? 'Actualizar Presupuesto'
                  : 'Crear Presupuesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
