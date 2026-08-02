import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { incomesService } from '@/services/incomesService';
import { recurringIncomesService } from '@/services/recurringIncomesService';
import type { Income } from '@/types/income';
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
  income?: Income | null;
  onSuccess?: () => void;
}

interface FormErrors {
  label?: string;
  amount?: string;
  daysOfMonth?: string;
  incomeDate?: string;
}

export function CreateIncomeSheet({
  open,
  onOpenChange,
  boardId,
  currency,
  income,
  onSuccess,
}: CreateIncomeSheetProps) {
  const isEditing = Boolean(income);
  const [mode, setMode] = useState<'one-time' | 'recurring'>('one-time');
  const [label, setLabel] = useState('Sueldo');
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([1]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const resolvedCurrency = (
    SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
      ? currency
      : DEFAULT_CURRENCY
  ) as SupportedCurrency;

  useEffect(() => {
    if (open) {
      if (income) {
        setMode('one-time');
        setLabel(income.label);
        setAmount(formatMoneyInputFromNumber(income.amount));
        setIncomeDate(income.incomeDate.slice(0, 10));
        setDaysOfMonth([1]);
      } else {
        setMode('one-time');
        setLabel('Sueldo');
        setAmount('');
        setIncomeDate(new Date().toISOString().slice(0, 10));
        setDaysOfMonth([1]);
      }
      setErrors({});
    }
  }, [open, income]);

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
      const numAmount = parseMoneyInput(amount);
      if (numAmount === null || numAmount < 0.01) {
        newErrors.amount = 'Ingresá un monto válido (mín. 0.01)';
      }
    }

    if (
      mode === 'one-time' &&
      incomeDate &&
      Number.isNaN(Date.parse(incomeDate))
    ) {
      newErrors.incomeDate = 'Fecha inválida';
    }

    if (mode === 'recurring' && daysOfMonth.length === 0) {
      newErrors.daysOfMonth = 'Seleccioná al menos un día del mes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEditing && income) {
        await incomesService.updateIncome(income._id, {
          label: label.trim(),
          amount: parseMoneyInput(amount)!,
          currency: resolvedCurrency,
          incomeDate: incomeDate || undefined,
        });
        toast.success('Ingreso actualizado');
      } else if (mode === 'one-time') {
        await incomesService.createIncome({
          boardId,
          label: label.trim(),
          amount: parseMoneyInput(amount)!,
          currency: resolvedCurrency,
          incomeDate: incomeDate || undefined,
        });
        toast.success('Ingreso registrado');
      } else {
        await recurringIncomesService.create({
          boardId,
          label: label.trim(),
          amount: parseMoneyInput(amount)!,
          currency: resolvedCurrency,
          daysOfMonth,
        });
        toast.success('Ingreso recurrente configurado');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo guardar el ingreso',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      mobilePresentation="dialog"
      title={isEditing ? 'Editar ingreso' : 'Registrar ingreso'}
      description={
        isEditing
          ? `Modificar ingreso puntual en ${resolvedCurrency}.`
          : mode === 'one-time'
            ? `Ingreso puntual en ${resolvedCurrency}.`
            : `Se proyectará cada mes en los días elegidos.`
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing ? (
          <Tabs
            value={mode}
            onValueChange={(value) =>
              setMode(value as 'one-time' | 'recurring')
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">Puntual</TabsTrigger>
              <TabsTrigger value="recurring">Recurrente</TabsTrigger>
            </TabsList>

            <TabsContent value="one-time" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-date">Fecha</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  disabled={isLoading}
                />
                {errors.incomeDate && (
                  <p className="text-sm text-destructive">
                    {errors.incomeDate}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recurring" className="mt-4 space-y-2">
              <Label>Días de acreditación</Label>
              <DayOfMonthPicker
                mode="multiple"
                value={daysOfMonth}
                onChange={setDaysOfMonth}
                disabled={isLoading}
              />
              {errors.daysOfMonth && (
                <p className="text-sm text-destructive">{errors.daysOfMonth}</p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="income-date">Fecha</Label>
            <Input
              id="income-date"
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              disabled={isLoading}
            />
            {errors.incomeDate && (
              <p className="text-sm text-destructive">{errors.incomeDate}</p>
            )}
          </div>
        )}

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
          <Label htmlFor="income-amount">Monto ({resolvedCurrency})</Label>
          <MoneyInput
            id="income-amount"
            value={amount}
            onChange={setAmount}
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
            {isLoading ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  );
}
