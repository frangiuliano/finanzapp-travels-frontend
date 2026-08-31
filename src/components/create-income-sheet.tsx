import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { formatMoneyInputFromNumber, parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { incomesService } from '@/services/incomesService';
import { recurringIncomesService } from '@/services/recurringIncomesService';
import type { Income } from '@/types/income';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@/constants/currencies';
import { notifyIncomesChanged } from '@/lib/income-events';
import { triggerSuccessHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const INCOME_CONCEPT_PRESETS = [
  'Sueldo',
  'Reintegro',
  'Transferencia',
  'Freelance',
  'Otro',
] as const;

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
  const [showDetails, setShowDetails] = useState(false);
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
      setShowDetails(false);
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
        const isFutureIncome = Boolean(
          incomeDate && new Date(incomeDate).getTime() > Date.now(),
        );
        await incomesService.createIncome({
          boardId,
          label: label.trim(),
          amount: parseMoneyInput(amount)!,
          currency: resolvedCurrency,
          incomeDate: incomeDate || undefined,
        });
        toast.success(
          isFutureIncome
            ? 'Ingreso futuro registrado como pendiente'
            : 'Ingreso registrado',
        );
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

      notifyIncomesChanged();
      triggerSuccessHaptic();
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
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar ingreso' : 'Nuevo ingreso'}
      description={
        isEditing
          ? income?.recurringIncomeId
            ? `Modificar solo esta ocurrencia del ingreso recurrente en ${resolvedCurrency}.`
            : `Modificar ingreso puntual en ${resolvedCurrency}.`
          : mode === 'one-time'
            ? `Ingreso puntual en ${resolvedCurrency}.`
            : `Se proyectará cada mes en los días elegidos.`
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            <TabsContent value="recurring" className="mt-4 space-y-2">
              <Label className="text-xs text-muted-foreground">
                Días de acreditación
              </Label>
              <DayOfMonthPicker
                mode="multiple"
                value={daysOfMonth}
                onChange={setDaysOfMonth}
                disabled={isLoading}
              />
              {errors.daysOfMonth && (
                <p className="text-xs text-destructive">{errors.daysOfMonth}</p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="space-y-2">
          <Label
            htmlFor="income-amount"
            className="text-xs text-muted-foreground"
          >
            Monto ({resolvedCurrency})
          </Label>
          <MoneyInput
            id="income-amount"
            value={amount}
            onChange={setAmount}
            disabled={isLoading}
            className={cn(
              'h-14 rounded-2xl text-2xl font-semibold',
              errors.amount && 'border-destructive',
            )}
            autoFocus
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="income-label"
            className="text-xs text-muted-foreground"
          >
            Concepto
          </Label>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Conceptos frecuentes"
          >
            {INCOME_CONCEPT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLabel(preset)}
                disabled={isLoading}
                aria-pressed={label === preset}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
          <Input
            id="income-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Sueldo, freelance…"
            disabled={isLoading}
            className={cn('rounded-xl', errors.label && 'border-destructive')}
          />
          {errors.label && (
            <p className="text-xs text-destructive">{errors.label}</p>
          )}
        </div>

        {mode === 'one-time' || isEditing ? (
          <>
            <button
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              aria-expanded={showDetails}
              aria-controls="income-more-options"
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform',
                  showDetails && 'rotate-180',
                )}
                aria-hidden
              />
              Más opciones
            </button>

            {showDetails ? (
              <div
                id="income-more-options"
                className="space-y-2 rounded-2xl border bg-muted/30 p-4"
              >
                <Label htmlFor="income-date" className="text-xs">
                  Fecha
                </Label>
                <Input
                  id="income-date"
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  disabled={isLoading}
                  className="rounded-xl"
                />
                {errors.incomeDate ? (
                  <p className="text-xs text-destructive">
                    {errors.incomeDate}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Si no la cambiás, se registra con la fecha de hoy.
                  </p>
                )}
              </div>
            ) : null}
          </>
        ) : null}

        <Button
          type="submit"
          className="h-12 rounded-2xl text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Guardando…
            </>
          ) : isEditing ? (
            'Actualizar ingreso'
          ) : mode === 'recurring' ? (
            'Configurar ingreso recurrente'
          ) : (
            'Registrar ingreso'
          )}
        </Button>
      </form>
    </ResponsiveFormDialog>
  );
}
