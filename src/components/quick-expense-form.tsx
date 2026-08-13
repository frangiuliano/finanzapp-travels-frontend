import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ChevronDown, Loader2, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreatePaymentMethodSheet } from '@/components/create-payment-method-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { budgetsService } from '@/services/budgetsService';
import { createExpenseWithOffline } from '@/services/createExpenseWithOffline';
import { expensesService } from '@/services/expensesService';
import { notifyExpensesChanged } from '@/lib/expense-events';
import { recurringExpensesService } from '@/services/recurringExpensesService';
import { installmentPlansService } from '@/services/installmentPlansService';
import { fxService } from '@/services/fxService';
import { participantsService } from '@/services/participantsService';
import { useAuthStore } from '@/store/authStore';
import { Budget } from '@/types/budget';
import { Board } from '@/types/board';
import {
  CreateExpenseDto,
  Expense,
  ExpenseStatus,
  SplitType,
  UpdateExpenseDto,
} from '@/types/expense';
import { Participant } from '@/types/participant';
import { formatPaymentMethodLabel } from '@/lib/format-payment-method-label';
import {
  getDayFromIsoDate,
  getYearMonthFromIsoDate,
  splitInstallmentAmounts,
} from '@/lib/installments';
import { formatCurrency } from '@/lib/utils';
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@/constants/currencies';
import type { PaymentMethod as BoardPaymentMethod } from '@/types/payment-method';
import { cn } from '@/lib/utils';

interface QuickExpenseFormProps {
  board: Board;
  onSuccess?: () => void;
  expense?: Expense | null;
  prefilledBudgets?: Budget[];
  prefilledParticipants?: Participant[];
  isDialog?: boolean;
}

function getParticipantName(participant: Participant): string {
  if (participant.guestName) {
    return participant.guestName;
  }
  if (typeof participant.userId === 'object' && participant.userId) {
    return `${participant.userId.firstName} ${participant.userId.lastName}`;
  }
  return 'Participante';
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateToIso(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date().toISOString();
  }
  return new Date(year, month - 1, day).toISOString();
}

function isSafeHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function QuickExpenseForm({
  board,
  onSuccess,
  expense,
  prefilledBudgets,
  prefilledParticipants,
  isDialog = false,
}: QuickExpenseFormProps) {
  const isEditing = Boolean(expense);
  const user = useAuthStore((state) => state.user);
  const isTravel = board.type === 'travel';
  const isEveryday = !isTravel;
  const boardCurrency = (
    SUPPORTED_CURRENCIES.includes(board.baseCurrency as SupportedCurrency)
      ? board.baseCurrency
      : DEFAULT_CURRENCY
  ) as SupportedCurrency;
  const [mode, setMode] = useState<'one-time' | 'recurring'>('one-time');
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([1]);
  const [expenseCurrency, setExpenseCurrency] =
    useState<SupportedCurrency>(boardCurrency);
  const [installments, setInstallments] = useState('1');
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxRateInput, setFxRateInput] = useState('');
  const [isFxLoading, setIsFxLoading] = useState(false);
  const [fxProviderEnabled, setFxProviderEnabled] = useState(true);

  const { categories, isLoading: categoriesLoading } = useBoardCategories(
    board._id,
  );
  const {
    paymentMethods,
    isLoading: paymentLoading,
    refetch: refetchPaymentMethods,
  } = useAvailablePaymentMethods(board._id);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIsoDate());
  const [showDetails, setShowDetails] = useState(Boolean(expense));
  const [showTravelOptions, setShowTravelOptions] = useState(
    isDialog && board.type === 'travel',
  );
  const [budgetId, setBudgetId] = useState('');
  const [paidByParticipantId, setPaidByParticipantId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>(ExpenseStatus.PAID);
  const [isDivisible, setIsDivisible] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [splitParticipantIds, setSplitParticipantIds] = useState<string[]>([]);
  const [manualSplits, setManualSplits] = useState<
    Record<string, { amount: string; enabled: boolean }>
  >({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [travelDataLoading, setTravelDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentMethodSheetOpen, setIsPaymentMethodSheetOpen] =
    useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = categoriesLoading || paymentLoading;

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === categoryId),
    [categories, categoryId],
  );

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method._id === paymentMethodId),
    [paymentMethods, paymentMethodId],
  );

  const parsedInstallments = Math.max(1, parseInt(installments, 10) || 1);
  const showInstallments =
    isEveryday &&
    !isEditing &&
    mode === 'one-time' &&
    selectedPaymentMethod?.kind === 'credit';
  const needsFx = expenseCurrency !== boardCurrency;
  const isCreditReferentialFx =
    needsFx &&
    selectedPaymentMethod?.kind === 'credit' &&
    selectedPaymentMethod?.closingDay != null;
  const resolvedFxRate = fxRateInput.trim()
    ? parseMoneyInput(fxRateInput)
    : fxRate;

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!paymentMethodId && paymentMethods.length > 0) {
      const cashMethod = paymentMethods.find(
        (method) => method.kind === 'cash',
      );
      setPaymentMethodId(cashMethod?._id ?? paymentMethods[0]._id);
    }
  }, [paymentMethods, paymentMethodId]);

  useEffect(() => {
    setExpenseCurrency(boardCurrency);
  }, [board._id, boardCurrency]);

  useEffect(() => {
    if (!needsFx || isEditing) {
      setFxRate(null);
      setFxRateInput('');
      setIsFxLoading(false);
      return;
    }

    let stale = false;
    setIsFxLoading(true);

    void fxService
      .getRate(expenseCurrency, boardCurrency)
      .then((result) => {
        if (stale) return;
        setFxRate(result.rate);
        setFxProviderEnabled(result.providerEnabled);
        setFxRateInput('');
      })
      .catch(() => {
        if (stale) return;
        setFxRate(null);
        setFxProviderEnabled(false);
      })
      .finally(() => {
        if (!stale) {
          setIsFxLoading(false);
        }
      });

    return () => {
      stale = true;
    };
  }, [needsFx, expenseCurrency, boardCurrency, isEditing]);

  useEffect(() => {
    if (!isTravel) {
      setParticipants([]);
      setBudgets([]);
      setPaidByParticipantId('');
      setSplitParticipantIds([]);
      setBudgetId('');
      setIsDivisible(false);
      setManualSplits({});
      setTravelDataLoading(false);
      return;
    }

    if (prefilledParticipants && prefilledBudgets) {
      setParticipants(prefilledParticipants);
      setBudgets(prefilledBudgets);
      const currentUserParticipant = prefilledParticipants.find(
        (participant) =>
          typeof participant.userId === 'object' &&
          participant.userId?._id === user?.id,
      );
      if (!isEditing) {
        setPaidByParticipantId(
          currentUserParticipant?._id ?? prefilledParticipants[0]?._id ?? '',
        );
        setSplitParticipantIds(
          prefilledParticipants.map((participant) => participant._id),
        );
      }
      setTravelDataLoading(false);
      return;
    }

    setPaidByParticipantId('');
    setSplitParticipantIds([]);
    setParticipants([]);
    setBudgets([]);
    setBudgetId('');
    setIsDivisible(false);
    setManualSplits({});

    let stale = false;
    setTravelDataLoading(true);

    void (async () => {
      try {
        const [participantsResult, budgetsResult] = await Promise.all([
          participantsService.getParticipants(board._id),
          budgetsService.getAllBudgetsByTrip(board._id),
        ]);

        if (stale) return;

        const loadedParticipants = participantsResult.participants;
        setParticipants(loadedParticipants);
        setBudgets(budgetsResult.budgets);

        if (!isEditing) {
          const currentUserParticipant = loadedParticipants.find(
            (participant) =>
              typeof participant.userId === 'object' &&
              participant.userId?._id === user?.id,
          );
          const defaultPaidBy =
            currentUserParticipant?._id ?? loadedParticipants[0]?._id ?? '';
          setPaidByParticipantId(defaultPaidBy);
          setSplitParticipantIds(
            loadedParticipants.map((participant) => participant._id),
          );
        }
      } catch (error) {
        if (!stale) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'Error al cargar datos del tablero travel',
          );
        }
      } finally {
        if (!stale) {
          setTravelDataLoading(false);
        }
      }
    })();

    return () => {
      stale = true;
    };
  }, [
    board._id,
    isTravel,
    user?.id,
    prefilledParticipants,
    prefilledBudgets,
    isEditing,
  ]);

  useEffect(() => {
    if (!expense) return;

    setAmount(expense.amount.toString());
    setNote(expense.description);
    setMerchantName(expense.merchantName || '');
    setStatus(expense.status);
    setExpenseDate(
      expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().slice(0, 10)
        : todayIsoDate(),
    );
    if (expense.categoryId) {
      setCategoryId(expense.categoryId);
    }
    if (expense.paymentMethodId) {
      setPaymentMethodId(expense.paymentMethodId);
    }
    if (
      expense.currency &&
      SUPPORTED_CURRENCIES.includes(expense.currency as SupportedCurrency)
    ) {
      setExpenseCurrency(expense.currency as SupportedCurrency);
    }
    setBudgetId(expense.budgetId || '');
    setPaidByParticipantId(
      expense.paidByParticipantId || expense.paidByParticipant?._id || '',
    );
    setIsDivisible(expense.isDivisible);
    setSplitType(expense.splitType || SplitType.EQUAL);

    if (expense.isDivisible && expense.splits?.length) {
      const ids = expense.splits.map((split) => split.participantId);
      setSplitParticipantIds(ids);
      const splits: Record<string, { amount: string; enabled: boolean }> = {};
      expense.splits.forEach((split) => {
        splits[split.participantId] = {
          amount: split.amount.toString(),
          enabled: true,
        };
      });
      setManualSplits(splits);
    }
  }, [expense]);

  const resetForm = useCallback(() => {
    setAmount('');
    setNote('');
    setExpenseDate(todayIsoDate());
    setShowDetails(isDialog);
    setShowTravelOptions(isDialog && isTravel);
    setBudgetId('');
    setIsDivisible(false);
    setSplitType(SplitType.EQUAL);
    setManualSplits({});
    setMerchantName('');
    setStatus(ExpenseStatus.PAID);
    setMode('one-time');
    setDaysOfMonth([1]);
    setExpenseCurrency(boardCurrency);
    setInstallments('1');
    setFxRate(null);
    setFxRateInput('');
    if (categories.length > 0) {
      setCategoryId(categories[0]._id);
    }
    if (paymentMethods.length > 0) {
      const cashMethod = paymentMethods.find(
        (method) => method.kind === 'cash',
      );
      setPaymentMethodId(cashMethod?._id ?? paymentMethods[0]._id);
    }
    if (isTravel && participants.length > 0) {
      const currentUserParticipant = participants.find(
        (participant) =>
          typeof participant.userId === 'object' &&
          participant.userId?._id === user?.id,
      );
      setPaidByParticipantId(
        currentUserParticipant?._id ?? participants[0]._id,
      );
      setSplitParticipantIds(
        participants.map((participant) => participant._id),
      );
    }
    setErrors({});
  }, [
    categories,
    paymentMethods,
    isTravel,
    participants,
    user?.id,
    isDialog,
    boardCurrency,
  ]);

  const resolveFxOverride = (): number | undefined => {
    if (!needsFx) return undefined;
    const rate = resolvedFxRate;
    if (rate == null || rate <= 0) {
      return undefined;
    }
    return rate;
  };

  const resolveInstallmentDay = (method?: BoardPaymentMethod): number => {
    if (method?.dueDay) return method.dueDay;
    if (method?.closingDay) return method.closingDay;
    return getDayFromIsoDate(expenseDate);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!amount.trim()) {
      nextErrors.amount = 'El monto es obligatorio';
    } else {
      const numAmount = parseMoneyInput(amount);
      if (numAmount === null || numAmount <= 0) {
        nextErrors.amount = 'El monto debe ser mayor a 0';
      }
    }

    if (!categoryId) {
      nextErrors.categoryId = 'Seleccioná una categoría';
    }

    if (!paymentMethodId) {
      nextErrors.paymentMethodId = 'Seleccioná un medio de pago';
    }

    const description = note.trim() || selectedCategory?.name || '';
    if (description.length < 3) {
      nextErrors.note = 'La nota debe tener al menos 3 caracteres';
    }

    if (isEveryday && !isEditing && mode === 'recurring') {
      if (daysOfMonth.length === 0) {
        nextErrors.daysOfMonth = 'Seleccioná el día del mes';
      }
    }

    if (showInstallments) {
      if (parsedInstallments < 1 || parsedInstallments > 120) {
        nextErrors.installments = 'Cantidad de cuotas inválida (1-120)';
      }
    }

    if (needsFx && !isEditing && !isCreditReferentialFx) {
      const rate = resolveFxOverride();
      if (rate == null) {
        nextErrors.fxRate = fxProviderEnabled
          ? 'Esperá el tipo de cambio o ingresalo manualmente'
          : 'Ingresá el tipo de cambio manualmente';
      }
    }

    if (isTravel && !paidByParticipantId) {
      nextErrors.paidBy = 'Seleccioná quién pagó';
    }

    if (isTravel && isDivisible) {
      if (splitType === SplitType.EQUAL && splitParticipantIds.length === 0) {
        nextErrors.splits = 'Incluí al menos un participante en el split';
      }

      if (splitType === SplitType.MANUAL) {
        const enabledSplits = Object.entries(manualSplits).filter(
          ([, value]) => value.enabled,
        );
        if (enabledSplits.length === 0) {
          nextErrors.splits = 'Incluí al menos un participante en el split';
        } else {
          const numAmount = parseMoneyInput(amount) || 0;
          const totalManualAmount = enabledSplits.reduce((sum, [, value]) => {
            const splitAmount = parseMoneyInput(value.amount);
            return sum + (splitAmount === null ? 0 : splitAmount);
          }, 0);
          if (Math.abs(totalManualAmount - numAmount) > 0.01) {
            nextErrors.splits = `La suma de las divisiones debe ser igual al monto total`;
          }
        }
      }
    }

    setErrors(nextErrors);

    if (nextErrors.note) {
      setShowDetails(true);
    }
    if (nextErrors.daysOfMonth) {
      setShowDetails(true);
    }
    if (nextErrors.paidBy || nextErrors.splits) {
      setShowTravelOptions(true);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const buildSplits = () => {
    if (!isDivisible) return undefined;

    if (splitType === SplitType.EQUAL) {
      return splitParticipantIds.map((participantId) => ({
        participantId,
        amount: 0,
      }));
    }

    return Object.entries(manualSplits)
      .filter(([, value]) => value.enabled)
      .map(([participantId, value]) => ({
        participantId,
        amount: parseMoneyInput(value.amount)!,
      }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const numAmount = parseMoneyInput(amount)!;
      const description = note.trim() || selectedCategory?.name || 'Gasto';
      const fxRateOverride = resolveFxOverride();

      if (isEveryday && !isEditing && mode === 'recurring') {
        await recurringExpensesService.create({
          boardId: board._id,
          label: description,
          amount: numAmount,
          currency: expenseCurrency,
          dayOfMonth: daysOfMonth[0],
          categoryId,
          paymentMethodId,
        });
        toast.success('Gasto recurrente configurado');
        resetForm();
        notifyExpensesChanged();
        onSuccess?.();
        return;
      }

      if (
        isEveryday &&
        !isEditing &&
        mode === 'one-time' &&
        showInstallments &&
        parsedInstallments > 1
      ) {
        const installmentAmounts = splitInstallmentAmounts(
          numAmount,
          parsedInstallments,
        );
        await installmentPlansService.create({
          boardId: board._id,
          label: description,
          installmentAmount: installmentAmounts[0],
          totalInstallments: parsedInstallments,
          startYearMonth: getYearMonthFromIsoDate(expenseDate),
          dayOfMonth: resolveInstallmentDay(selectedPaymentMethod),
          paymentMethodId,
          currency: expenseCurrency,
          fxRateOverride,
        });
        toast.success(`Compra en ${parsedInstallments} cuotas configurada`);
        resetForm();
        notifyExpensesChanged();
        onSuccess?.();
        return;
      }

      const payload: CreateExpenseDto = {
        boardId: board._id,
        amount: numAmount,
        currency: expenseCurrency,
        fxRateOverride,
        description,
        categoryId,
        paymentMethodId,
        expenseDate: localDateToIso(expenseDate),
      };

      if (isTravel) {
        payload.paidByParticipantId = paidByParticipantId;
        payload.status = status;
        payload.merchantName = merchantName.trim() || undefined;
        if (budgetId && budgetId !== 'none') {
          payload.budgetId = budgetId;
        }
        payload.isDivisible = isDivisible;
        if (isDivisible) {
          payload.splitType = splitType;
          payload.splits = buildSplits();
        }
      }

      if (isEditing && expense) {
        const updatePayload: UpdateExpenseDto = { ...payload };
        await expensesService.updateExpense(expense._id, updatePayload);
        toast.success('Gasto actualizado');
      } else {
        const result = await createExpenseWithOffline(payload);
        if (result.mode === 'queued') {
          toast.success(
            'Gasto guardado. Se sincronizará al volver la conexión.',
          );
        } else {
          toast.success('Gasto registrado');
        }
      }

      if (!isEditing) {
        resetForm();
      }
      onSuccess?.();
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: Record<string, string>;
      }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al registrar el gasto',
      );
      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSplitParticipant = (participantId: string, enabled: boolean) => {
    setSplitParticipantIds((current) => {
      if (enabled) {
        return current.includes(participantId)
          ? current
          : [...current, participantId];
      }
      return current.filter((id) => id !== participantId);
    });
    setManualSplits((current) => ({
      ...current,
      [participantId]: {
        amount: current[participantId]?.amount || '',
        enabled,
      },
    }));
  };

  const updateManualSplitAmount = (participantId: string, value: string) => {
    setManualSplits((current) => ({
      ...current,
      [participantId]: {
        amount: value,
        enabled: current[participantId]?.enabled ?? true,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Preparando captura…</p>
      </div>
    );
  }

  if (categories.length === 0 || paymentMethods.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {categories.length === 0
            ? 'No hay categorías activas en este tablero.'
            : 'No hay medios de pago disponibles.'}
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/boards/settings?tab=payment-methods">
            <Settings2 className="mr-1.5 size-4" />
            Configurar medios de pago
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isEveryday && !isEditing ? (
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as 'one-time' | 'recurring')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="one-time">Puntual</TabsTrigger>
            <TabsTrigger value="recurring">Recurrente</TabsTrigger>
          </TabsList>
          <TabsContent value="recurring" className="mt-4 space-y-2">
            <Label className="text-muted-foreground text-xs">Día del mes</Label>
            <DayOfMonthPicker
              mode="single"
              value={daysOfMonth}
              onChange={setDaysOfMonth}
              disabled={isSubmitting}
            />
            {errors.daysOfMonth ? (
              <p className="text-destructive text-xs">{errors.daysOfMonth}</p>
            ) : (
              <p className="text-muted-foreground text-[11px]">
                Se generarán gastos programados cada mes en ese día.
              </p>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor="quick-amount"
            className="text-muted-foreground text-xs"
          >
            Monto ({expenseCurrency})
          </Label>
          <Select
            value={expenseCurrency}
            onValueChange={(value) =>
              setExpenseCurrency(value as SupportedCurrency)
            }
            disabled={isSubmitting || isEditing}
          >
            <SelectTrigger className="h-8 w-[110px] rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MoneyInput
          id="quick-amount"
          placeholder="0,00"
          value={amount}
          onChange={setAmount}
          className={cn(
            'h-14 rounded-2xl text-2xl font-semibold',
            errors.amount && 'border-destructive',
          )}
          autoFocus
        />
        {errors.amount ? (
          <p className="text-destructive text-xs">{errors.amount}</p>
        ) : null}
        {needsFx && !isEditing ? (
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            {isCreditReferentialFx ? (
              <p className="text-muted-foreground text-xs">
                Con tarjeta de crédito, el equivalente en {boardCurrency} es{' '}
                <strong>referencial</strong> y usa el TC del momento. Al cerrar
                el ciclo se fijará el TC del día de cierre.
              </p>
            ) : null}
            {isFxLoading ? (
              <p className="text-muted-foreground text-xs">
                Cargando tipo de cambio…
              </p>
            ) : fxRate != null && !fxRateInput.trim() ? (
              <p className="text-muted-foreground text-xs">
                1 {expenseCurrency} = {fxRate.toLocaleString('es-AR')}{' '}
                {boardCurrency}
                {parseMoneyInput(amount) != null &&
                parseMoneyInput(amount)! > 0 ? (
                  <>
                    {' '}
                    · ≈{' '}
                    {formatCurrency(
                      parseMoneyInput(amount)! * fxRate,
                      boardCurrency,
                    )}
                  </>
                ) : null}
              </p>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="fx-rate" className="text-xs">
                Tipo de cambio manual ({expenseCurrency} → {boardCurrency})
                {isCreditReferentialFx ? ' (opcional)' : ''}
              </Label>
              <Input
                id="fx-rate"
                inputMode="decimal"
                placeholder={
                  isCreditReferentialFx
                    ? 'Opcional — se actualiza al ver el gasto'
                    : fxProviderEnabled
                      ? 'Opcional'
                      : 'Requerido'
                }
                value={fxRateInput}
                onChange={(event) => setFxRateInput(event.target.value)}
                className={cn(
                  'rounded-xl',
                  errors.fxRate && 'border-destructive',
                )}
              />
              {errors.fxRate ? (
                <p className="text-destructive text-xs">{errors.fxRate}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quick-note" className="text-muted-foreground text-xs">
          Descripción
        </Label>
        <Input
          id="quick-note"
          placeholder="Ej. supermercado, almuerzo…"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={cn('rounded-xl', errors.note && 'border-destructive')}
          maxLength={500}
        />
        {errors.note ? (
          <p className="text-destructive text-xs">{errors.note}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Categoría</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = categoryId === category._id;
            return (
              <button
                key={category._id}
                type="button"
                onClick={() => setCategoryId(category._id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  isSelected
                    ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)] text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/20',
                )}
                style={
                  isSelected && category.color && isSafeHexColor(category.color)
                    ? {
                        borderColor: category.color,
                        backgroundColor: `color-mix(in oklab, ${category.color} 18%, transparent)`,
                      }
                    : undefined
                }
              >
                {category.name}
              </button>
            );
          })}
        </div>
        {errors.categoryId ? (
          <p className="text-destructive text-xs">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Medio de pago</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={() => setIsPaymentMethodSheetOpen(true)}
          >
            <Plus className="size-3.5" />
            Agregar tarjeta
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const isSelected = paymentMethodId === method._id;
            return (
              <button
                key={method._id}
                type="button"
                onClick={() => setPaymentMethodId(method._id)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_12%,transparent)]'
                    : 'border-border hover:border-foreground/20',
                )}
              >
                <span className="block font-medium leading-snug">
                  {formatPaymentMethodLabel(method)}
                </span>
                {method.kind === 'credit' && !method.closingDay ? (
                  <span className="text-muted-foreground text-[11px]">
                    Sin día de cierre
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {errors.paymentMethodId ? (
          <p className="text-destructive text-xs">{errors.paymentMethodId}</p>
        ) : null}
      </div>

      {showInstallments ? (
        <div className="space-y-2">
          <Label
            htmlFor="installments"
            className="text-muted-foreground text-xs"
          >
            Cuotas
          </Label>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 6, 12, 18, 24].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setInstallments(String(value))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  parsedInstallments === value
                    ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
                    : 'border-border text-muted-foreground hover:border-foreground/20',
                )}
              >
                {value === 1 ? '1 (contado)' : `${value} cuotas`}
              </button>
            ))}
          </div>
          <Input
            id="installments"
            type="number"
            min={1}
            max={120}
            value={installments}
            onChange={(event) => setInstallments(event.target.value)}
            className={cn(
              'rounded-xl',
              errors.installments && 'border-destructive',
            )}
          />
          {errors.installments ? (
            <p className="text-destructive text-xs">{errors.installments}</p>
          ) : parsedInstallments > 1 && parseMoneyInput(amount) != null ? (
            <p className="text-muted-foreground text-[11px]">
              {parsedInstallments} cuotas de{' '}
              {formatCurrency(
                splitInstallmentAmounts(
                  parseMoneyInput(amount)!,
                  parsedInstallments,
                )[0],
                expenseCurrency,
              )}
              {splitInstallmentAmounts(
                parseMoneyInput(amount)!,
                parsedInstallments,
              ).length > 1
                ? ` (última: ${formatCurrency(
                    splitInstallmentAmounts(
                      parseMoneyInput(amount)!,
                      parsedInstallments,
                    ).at(-1)!,
                    expenseCurrency,
                  )})`
                : ''}
            </p>
          ) : (
            <p className="text-muted-foreground text-[11px]">
              Con tarjeta de crédito podés financiar la compra en cuotas.
            </p>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowDetails((open) => !open)}
        className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            'size-4 transition-transform',
            showDetails && 'rotate-180',
          )}
        />
        Más opciones
      </button>

      {showDetails ? (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          {mode === 'one-time' || isTravel || isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="quick-date" className="text-xs">
                Fecha
              </Label>
              <Input
                id="quick-date"
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-[11px]">
                Si no la cambiás, se registra con la fecha de hoy.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isTravel ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowTravelOptions((open) => !open)}
            className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                showTravelOptions && 'rotate-180',
              )}
            />
            Opciones de viaje
          </button>

          {showTravelOptions ? (
            <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
              {travelDataLoading ? (
                <p className="text-muted-foreground text-sm">Cargando…</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Quién pagó</Label>
                    <Select
                      value={paidByParticipantId}
                      onValueChange={setPaidByParticipantId}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {participants.map((participant) => (
                          <SelectItem
                            key={participant._id}
                            value={participant._id}
                          >
                            {getParticipantName(participant)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.paidBy ? (
                      <p className="text-destructive text-xs">
                        {errors.paidBy}
                      </p>
                    ) : null}
                  </div>

                  {budgets.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Presupuesto (opcional)</Label>
                      <Select
                        value={budgetId || 'none'}
                        onValueChange={setBudgetId}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Sin presupuesto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin presupuesto</SelectItem>
                          {budgets.map((budget) => (
                            <SelectItem key={budget._id} value={budget._id}>
                              {budget.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="quick-merchant" className="text-xs">
                      Comercio (opcional)
                    </Label>
                    <Input
                      id="quick-merchant"
                      value={merchantName}
                      onChange={(event) => setMerchantName(event.target.value)}
                      placeholder="Ej. Restaurante, farmacia…"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Estado</Label>
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        setStatus(value as ExpenseStatus)
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ExpenseStatus.PAID}>
                          Pagado
                        </SelectItem>
                        <SelectItem value={ExpenseStatus.PENDING}>
                          Pendiente
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="quick-divisible"
                      checked={isDivisible}
                      onCheckedChange={(checked) =>
                        setIsDivisible(checked === true)
                      }
                    />
                    <Label htmlFor="quick-divisible" className="text-sm">
                      Dividir entre participantes
                    </Label>
                  </div>

                  {isDivisible ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Tipo de división</Label>
                        <Select
                          value={splitType}
                          onValueChange={(value) =>
                            setSplitType(value as SplitType)
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SplitType.EQUAL}>
                              Igual entre participantes
                            </SelectItem>
                            <SelectItem value={SplitType.MANUAL}>
                              Montos manuales
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {splitType === SplitType.EQUAL ? (
                        <ul className="space-y-2">
                          {participants.map((participant) => {
                            const enabled = splitParticipantIds.includes(
                              participant._id,
                            );
                            return (
                              <li
                                key={participant._id}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                              >
                                <Checkbox
                                  id={`split-${participant._id}`}
                                  checked={enabled}
                                  onCheckedChange={(checked) =>
                                    toggleSplitParticipant(
                                      participant._id,
                                      checked === true,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`split-${participant._id}`}
                                  className="text-sm font-normal"
                                >
                                  {getParticipantName(participant)}
                                </Label>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <ul className="space-y-2">
                          {participants.map((participant) => {
                            const splitState = manualSplits[participant._id];
                            const enabled = splitState?.enabled ?? false;
                            return (
                              <li
                                key={participant._id}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                              >
                                <Checkbox
                                  id={`split-manual-${participant._id}`}
                                  checked={enabled}
                                  onCheckedChange={(checked) =>
                                    toggleSplitParticipant(
                                      participant._id,
                                      checked === true,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`split-manual-${participant._id}`}
                                  className="min-w-0 flex-1 text-sm font-normal"
                                >
                                  {getParticipantName(participant)}
                                </Label>
                                <MoneyInput
                                  value={splitState?.amount || ''}
                                  onChange={(value) =>
                                    updateManualSplitAmount(
                                      participant._id,
                                      value,
                                    )
                                  }
                                  disabled={!enabled}
                                  className="h-8 w-24 rounded-lg"
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {errors.splits ? (
                        <p className="text-destructive text-xs">
                          {errors.splits}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {errors.note && !showDetails ? (
        <p className="text-destructive text-xs">{errors.note}</p>
      ) : null}

      {isTravel && errors.paidBy && !showTravelOptions ? (
        <p className="text-destructive text-xs">{errors.paidBy}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || (isTravel && travelDataLoading)}
        className="h-12 rounded-2xl bg-[var(--signal)] text-base font-semibold text-white hover:bg-[color-mix(in_oklab,var(--signal)_88%,black)]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Guardando…
          </>
        ) : isEditing ? (
          'Actualizar gasto'
        ) : mode === 'recurring' && isEveryday ? (
          'Configurar gasto recurrente'
        ) : showInstallments && parsedInstallments > 1 ? (
          `Registrar gasto en ${parsedInstallments} cuotas`
        ) : (
          'Registrar gasto'
        )}
      </Button>

      <CreatePaymentMethodSheet
        open={isPaymentMethodSheetOpen}
        onOpenChange={setIsPaymentMethodSheetOpen}
        boardId={board._id}
        boardName={board.name}
        onCreated={async (paymentMethod) => {
          await refetchPaymentMethods();
          setPaymentMethodId(paymentMethod._id);
        }}
      />
    </form>
  );
}
