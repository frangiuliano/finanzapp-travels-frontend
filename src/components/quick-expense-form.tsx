import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  Calculator,
  ChevronDown,
  Loader2,
  Plus,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatePaymentMethodSheet } from '@/components/create-payment-method-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import {
  getBoardScopedCache,
  saveBoardScopedCache,
} from '@/lib/board-scoped-cache';
import { parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DayOfMonthPicker } from '@/components/day-of-month-picker';
import { RecurringMonthsChecklist } from '@/components/recurring-months-checklist';
import { RecurringEscalationFields } from '@/components/recurring-escalation-fields';
import {
  buildRecurringEscalationPayload,
  defaultRecurringEscalationState,
  validateRecurringEscalation,
  type RecurringEscalationFormState,
} from '@/lib/recurring-escalation';
import { YearMonthSelector } from '@/components/year-month-selector';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { budgetsService } from '@/services/budgetsService';
import { createExpenseWithOffline } from '@/services/createExpenseWithOffline';
import { expensesService } from '@/services/expensesService';
import { notifyExpensesChanged } from '@/lib/expense-events';
import { recurringExpensesService } from '@/services/recurringExpensesService';
import { installmentPlansService } from '@/services/installmentPlansService';
import type { InstallmentRescheduleScope } from '@/types/installment-plan';
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
import {
  formatCurrency,
  formatYearMonth,
  monthsBetweenYearMonths,
  shiftYearMonth,
} from '@/lib/utils';
import { triggerSuccessHaptic } from '@/lib/haptics';
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
  onOpenSimulator?: (values: {
    label: string;
    totalAmount: string;
    startYearMonth: string;
  }) => void;
}

const PARTICIPANTS_CACHE_NAMESPACE = 'participants';
const BUDGETS_CACHE_NAMESPACE = 'budgets';

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

function getHistoricalPaymentMethod(
  expense?: Expense | null,
): BoardPaymentMethod | undefined {
  if (expense?.paymentMethodDetails) return expense.paymentMethodDetails;
  if (!expense?.card) return undefined;

  return {
    _id: expense.paymentMethodId ?? expense.card._id,
    ownerType: 'user',
    kind: expense.card.type === 'debit' ? 'debit' : 'credit',
    name: expense.card.name,
    lastFourDigits: expense.card.lastFourDigits,
    isActive: true,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export function QuickExpenseForm({
  board,
  onSuccess,
  expense,
  prefilledBudgets,
  prefilledParticipants,
  isDialog = false,
  onOpenSimulator,
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([1]);
  const [excludedYearMonths, setExcludedYearMonths] = useState<string[]>([]);
  const [recurringEscalation, setRecurringEscalation] =
    useState<RecurringEscalationFormState>(defaultRecurringEscalationState);
  const [expenseCurrency, setExpenseCurrency] =
    useState<SupportedCurrency>(boardCurrency);
  const [installments, setInstallments] = useState('1');
  const [installmentOrigin, setInstallmentOrigin] = useState<'new' | 'ongoing'>(
    'new',
  );
  const [currentInstallmentNumber, setCurrentInstallmentNumber] = useState('1');
  const [installmentRescheduleScope, setInstallmentRescheduleScope] =
    useState<InstallmentRescheduleScope>('this');
  const [paymentYearMonth, setPaymentYearMonth] = useState(
    getYearMonthFromIsoDate(todayIsoDate()),
  );
  const [installmentPlanSchedule, setInstallmentPlanSchedule] = useState<{
    startYearMonth: string;
    totalInstallments: number;
  } | null>(null);
  const [currentInstallmentYearMonth, setCurrentInstallmentYearMonth] =
    useState(getYearMonthFromIsoDate(todayIsoDate()));
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxRateInput, setFxRateInput] = useState('');
  const [isFxLoading, setIsFxLoading] = useState(false);
  const [fxProviderEnabled, setFxProviderEnabled] = useState(true);

  const { categories, isLoading: categoriesLoading } = useBoardCategories(
    board._id,
  );
  const historicalPaymentMethod = useMemo(
    () => getHistoricalPaymentMethod(expense),
    [expense],
  );
  const {
    paymentMethods,
    isLoading: paymentLoading,
    refetch: refetchPaymentMethods,
    unavailableCurrentPaymentMethodId,
  } = useAvailablePaymentMethods(board._id, historicalPaymentMethod);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIsoDate());
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
    !isRecurring &&
    selectedPaymentMethod?.kind === 'credit';
  const isOngoingInstallmentPlan =
    showInstallments &&
    parsedInstallments > 1 &&
    installmentOrigin === 'ongoing';
  const isInstallmentOccurrence = Boolean(
    isEditing &&
    expense?.installmentPlanId &&
    expense.installmentNumber != null,
  );
  const installmentSchedulePreview = useMemo(() => {
    if (
      !installmentPlanSchedule ||
      !expense?.installmentNumber ||
      installmentRescheduleScope === 'all'
    ) {
      return [];
    }
    const anchorNumber = expense.installmentNumber;
    const anchorCanonicalMonth = shiftYearMonth(
      installmentPlanSchedule.startYearMonth,
      anchorNumber - 1,
    );
    const deltaMonths = monthsBetweenYearMonths(
      anchorCanonicalMonth,
      paymentYearMonth,
    );

    return Array.from(
      { length: Math.min(installmentPlanSchedule.totalInstallments, 120) },
      (_, index) => {
        const installmentNumber = index + 1;
        const canonicalMonth = shiftYearMonth(
          installmentPlanSchedule.startYearMonth,
          index,
        );
        let displayMonth = canonicalMonth;
        if (
          installmentRescheduleScope === 'this' &&
          installmentNumber === anchorNumber
        ) {
          displayMonth = paymentYearMonth;
        } else if (
          installmentRescheduleScope === 'this_and_future' &&
          installmentNumber >= anchorNumber
        ) {
          displayMonth = shiftYearMonth(canonicalMonth, deltaMonths);
        }
        return {
          installmentNumber,
          yearMonth: displayMonth,
          isAnchor: installmentNumber === anchorNumber,
        };
      },
    );
  }, [
    installmentPlanSchedule,
    expense?.installmentNumber,
    installmentRescheduleScope,
    paymentYearMonth,
  ]);
  const parsedCurrentInstallmentNumber = Math.min(
    parsedInstallments,
    Math.max(1, parseInt(currentInstallmentNumber, 10) || 1),
  );
  const paidInstallments = isOngoingInstallmentPlan
    ? parsedCurrentInstallmentNumber - 1
    : 0;
  const installmentStartYearMonth = isOngoingInstallmentPlan
    ? shiftYearMonth(
        currentInstallmentYearMonth,
        -(parsedCurrentInstallmentNumber - 1),
      )
    : paymentYearMonth;
  const needsFx = expenseCurrency !== boardCurrency;
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
      saveBoardScopedCache(
        PARTICIPANTS_CACHE_NAMESPACE,
        board._id,
        prefilledParticipants,
      );
      saveBoardScopedCache(
        BUDGETS_CACHE_NAMESPACE,
        board._id,
        prefilledBudgets,
      );
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
        saveBoardScopedCache(
          PARTICIPANTS_CACHE_NAMESPACE,
          board._id,
          loadedParticipants,
        );
        saveBoardScopedCache(
          BUDGETS_CACHE_NAMESPACE,
          board._id,
          budgetsResult.budgets,
        );
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
          const cachedParticipants = getBoardScopedCache<Participant[]>(
            PARTICIPANTS_CACHE_NAMESPACE,
            board._id,
          );
          const cachedBudgets = getBoardScopedCache<Budget[]>(
            BUDGETS_CACHE_NAMESPACE,
            board._id,
          );

          if (cachedParticipants !== null && cachedBudgets !== null) {
            setParticipants(cachedParticipants);
            setBudgets(cachedBudgets);
            if (!isEditing) {
              const currentUserParticipant = cachedParticipants.find(
                (participant) =>
                  typeof participant.userId === 'object' &&
                  participant.userId?._id === user?.id,
              );
              setPaidByParticipantId(
                currentUserParticipant?._id ?? cachedParticipants[0]?._id ?? '',
              );
              setSplitParticipantIds(
                cachedParticipants.map((participant) => participant._id),
              );
            }
            return;
          }

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
    setPaymentYearMonth(
      expense.paymentYearMonth ||
        getYearMonthFromIsoDate(
          expense.expenseDate
            ? new Date(expense.expenseDate).toISOString()
            : todayIsoDate(),
        ),
    );
    setInstallmentRescheduleScope('this');
    if (expense.installmentPlanId) {
      setInstallmentPlanSchedule(null);
      installmentPlansService
        .getOne(expense.installmentPlanId)
        .then(({ installmentPlan }) =>
          setInstallmentPlanSchedule({
            startYearMonth: installmentPlan.startYearMonth,
            totalInstallments: installmentPlan.totalInstallments,
          }),
        )
        .catch(() => setInstallmentPlanSchedule(null));
    } else {
      setInstallmentPlanSchedule(null);
    }
    if (expense.categoryId) {
      setCategoryId(expense.categoryId);
    }
    const historicalMethodId =
      expense.paymentMethodId ??
      expense.paymentMethodDetails?._id ??
      expense.card?._id;
    if (historicalMethodId) {
      setPaymentMethodId(historicalMethodId);
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
    setPaymentYearMonth(getYearMonthFromIsoDate(todayIsoDate()));
    setShowTravelOptions(isDialog && isTravel);
    setBudgetId('');
    setIsDivisible(false);
    setSplitType(SplitType.EQUAL);
    setManualSplits({});
    setMerchantName('');
    setStatus(ExpenseStatus.PAID);
    setIsRecurring(false);
    setDaysOfMonth([1]);
    setExcludedYearMonths([]);
    setRecurringEscalation(defaultRecurringEscalationState);
    setExpenseCurrency(boardCurrency);
    setInstallments('1');
    setInstallmentOrigin('new');
    setCurrentInstallmentNumber('1');
    setCurrentInstallmentYearMonth(getYearMonthFromIsoDate(todayIsoDate()));
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

  const resolveInstallmentDay = (): number => getDayFromIsoDate(expenseDate);

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

    if (!isRecurring && !/^\d{4}-(0[1-9]|1[0-2])$/.test(paymentYearMonth)) {
      nextErrors.paymentYearMonth = 'Seleccioná el mes de pago';
    }

    const description = note.trim() || selectedCategory?.name || '';
    if (description.length < 3) {
      nextErrors.note = 'La nota debe tener al menos 3 caracteres';
    }

    if (isEveryday && !isEditing && isRecurring) {
      if (daysOfMonth.length === 0) {
        nextErrors.daysOfMonth = 'Seleccioná el día del mes';
      }
      const escalationError = validateRecurringEscalation(recurringEscalation);
      if (escalationError) {
        nextErrors.escalation = escalationError;
      }
      if (excludedYearMonths.length >= 12) {
        nextErrors.recurringMonths =
          'Incluí al menos uno de los próximos 12 meses';
      }
    }

    if (showInstallments) {
      if (parsedInstallments < 1 || parsedInstallments > 120) {
        nextErrors.installments = 'Cantidad de cuotas inválida (1-120)';
      }
      if (isOngoingInstallmentPlan && !currentInstallmentYearMonth) {
        nextErrors.currentInstallmentYearMonth =
          'Seleccioná el mes de esa cuota';
      }
    }

    if (needsFx && !isEditing) {
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

      if (isEveryday && !isEditing && isRecurring) {
        await recurringExpensesService.create({
          boardId: board._id,
          label: description,
          amount: numAmount,
          currency: expenseCurrency,
          dayOfMonth: daysOfMonth[0],
          categoryId,
          paymentMethodId,
          excludedYearMonths,
          ...buildRecurringEscalationPayload(recurringEscalation),
        });
        toast.success('Gasto recurrente configurado');
        resetForm();
        notifyExpensesChanged();
        triggerSuccessHaptic();
        onSuccess?.();
        return;
      }

      if (
        isEveryday &&
        !isEditing &&
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
          paidInstallments,
          startYearMonth: installmentStartYearMonth,
          dayOfMonth: resolveInstallmentDay(),
          paymentMethodId,
          currency: expenseCurrency,
          fxRateOverride,
        });
        toast.success(`Compra en ${parsedInstallments} cuotas configurada`);
        resetForm();
        notifyExpensesChanged();
        triggerSuccessHaptic();
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
        paymentYearMonth,
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

        if (
          expense.installmentPlanId &&
          expense.installmentNumber != null &&
          installmentRescheduleScope !== 'this'
        ) {
          const { updated } = await installmentPlansService.reschedule(
            expense.installmentPlanId,
            {
              installmentNumber: expense.installmentNumber,
              targetYearMonth: paymentYearMonth,
              scope: installmentRescheduleScope,
            },
          );
          toast.success(
            `Gasto actualizado y ${updated} cuota${updated === 1 ? '' : 's'} reprogramada${updated === 1 ? '' : 's'}`,
          );
        } else {
          toast.success('Gasto actualizado');
        }
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
      triggerSuccessHaptic();
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
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={errors.amount ? 'quick-amount-error' : undefined}
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
          <p
            id="quick-amount-error"
            role="alert"
            className="text-destructive text-xs"
          >
            {errors.amount}
          </p>
        ) : null}
        {needsFx && !isEditing ? (
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
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
              </Label>
              <Input
                id="fx-rate"
                aria-invalid={Boolean(errors.fxRate)}
                aria-describedby={errors.fxRate ? 'fx-rate-error' : undefined}
                inputMode="decimal"
                placeholder={fxProviderEnabled ? 'Opcional' : 'Requerido'}
                value={fxRateInput}
                onChange={(event) => setFxRateInput(event.target.value)}
                className={cn(
                  'rounded-xl',
                  errors.fxRate && 'border-destructive',
                )}
              />
              {errors.fxRate ? (
                <p
                  id="fx-rate-error"
                  role="alert"
                  className="text-destructive text-xs"
                >
                  {errors.fxRate}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {isEditing &&
      expense?.installmentPlanId &&
      expense.installmentNumber != null ? (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          <Label className="text-xs">
            Esta cuota pertenece a un plan. Al guardar, ¿qué querés actualizar?
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'this', label: 'Solo esta cuota' },
                { value: 'this_and_future', label: 'Esta y las siguientes' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setInstallmentRescheduleScope(option.value)}
                aria-pressed={installmentRescheduleScope === option.value}
                className={cn(
                  'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  installmentRescheduleScope === option.value
                    ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
                    : 'border-border text-muted-foreground hover:border-foreground/20',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-[11px]">
            ¿Necesitás corregir todas las cuotas del plan, incluidas las
            pagadas? Hacelo desde Configuración de tablero → Cuotas.
          </p>

          {isInstallmentOccurrence ? (
            <div className="space-y-1">
              {installmentSchedulePreview.length > 0 ? (
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border bg-card p-2">
                  {installmentSchedulePreview.map((entry) => (
                    <span
                      key={entry.installmentNumber}
                      className={cn(
                        'whitespace-nowrap rounded-lg border px-2 py-1 text-[11px]',
                        entry.isAnchor
                          ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
                          : 'border-border',
                      )}
                    >
                      {entry.yearMonth.slice(5, 7)}/
                      {entry.yearMonth.slice(2, 4)} · Cuota{' '}
                      {entry.installmentNumber}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="text-muted-foreground text-[11px]">
                {installmentRescheduleScope === 'this_and_future'
                  ? 'Las siguientes cuotas que todavía no se pagaron se corren la misma cantidad de meses.'
                  : 'Las demás cuotas no se modifican.'}{' '}
                La fecha queda como dato informativo de esta cuota.
              </p>
            </div>
          ) : installmentRescheduleScope !== 'this' ? (
            <p className="text-muted-foreground text-[11px]">
              El día del mes de la fecha elegida se va a aplicar a esta cuota y
              a las siguientes que todavía no fueron pagadas. Las cuotas
              omitidas no se ven afectadas.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="quick-note" className="text-muted-foreground text-xs">
          Descripción
        </Label>
        <Input
          id="quick-note"
          aria-invalid={Boolean(errors.note)}
          aria-describedby={errors.note ? 'quick-note-error' : undefined}
          placeholder="Ej. supermercado, almuerzo…"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={cn('rounded-xl', errors.note && 'border-destructive')}
          maxLength={500}
        />
        {errors.note ? (
          <p
            id="quick-note-error"
            role="alert"
            className="text-destructive text-xs"
          >
            {errors.note}
          </p>
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
                aria-pressed={isSelected}
                aria-describedby={
                  errors.categoryId ? 'quick-category-error' : undefined
                }
                className={cn(
                  'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
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
          <p
            id="quick-category-error"
            role="alert"
            className="text-destructive text-xs"
          >
            {errors.categoryId}
          </p>
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
            const isHistoricalUnavailable =
              unavailableCurrentPaymentMethodId === method._id;
            return (
              <button
                key={method._id}
                type="button"
                onClick={() => setPaymentMethodId(method._id)}
                aria-pressed={isSelected}
                aria-describedby={
                  errors.paymentMethodId ? 'quick-payment-error' : undefined
                }
                disabled={isHistoricalUnavailable && !isSelected}
                className={cn(
                  'min-h-11 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isSelected
                    ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_12%,transparent)]'
                    : 'border-border hover:border-foreground/20',
                )}
              >
                <span className="block font-medium leading-snug">
                  {formatPaymentMethodLabel(method)}
                </span>
                {isHistoricalUnavailable ? (
                  <span className="text-muted-foreground text-[11px]">
                    Medio histórico · no disponible para nuevos gastos
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {errors.paymentMethodId ? (
          <p
            id="quick-payment-error"
            role="alert"
            className="text-destructive text-xs"
          >
            {errors.paymentMethodId}
          </p>
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
                aria-pressed={parsedInstallments === value}
                className={cn(
                  'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
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
            aria-invalid={Boolean(errors.installments)}
            aria-describedby={
              errors.installments ? 'installments-error' : undefined
            }
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
            <p
              id="installments-error"
              role="alert"
              className="text-destructive text-xs"
            >
              {errors.installments}
            </p>
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

          {parsedInstallments > 1 ? (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInstallmentOrigin('new')}
                  aria-pressed={installmentOrigin === 'new'}
                  className={cn(
                    'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    installmentOrigin === 'new'
                      ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
                      : 'border-border text-muted-foreground hover:border-foreground/20',
                  )}
                >
                  Compra nueva
                </button>
                <button
                  type="button"
                  onClick={() => setInstallmentOrigin('ongoing')}
                  aria-pressed={installmentOrigin === 'ongoing'}
                  className={cn(
                    'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    installmentOrigin === 'ongoing'
                      ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_14%,transparent)]'
                      : 'border-border text-muted-foreground hover:border-foreground/20',
                  )}
                >
                  Ya la vengo pagando
                </button>
              </div>

              {installmentOrigin === 'ongoing' ? (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="current-installment-number"
                      className="text-muted-foreground text-xs"
                    >
                      ¿Qué cuota pagás?
                    </Label>
                    <Input
                      id="current-installment-number"
                      type="number"
                      min={1}
                      max={parsedInstallments}
                      value={currentInstallmentNumber}
                      onChange={(event) =>
                        setCurrentInstallmentNumber(event.target.value)
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      ¿En qué mes es esa cuota?
                    </Label>
                    <YearMonthSelector
                      yearMonth={currentInstallmentYearMonth}
                      onChange={setCurrentInstallmentYearMonth}
                    />
                  </div>
                  {errors.currentInstallmentYearMonth ? (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.currentInstallmentYearMonth}
                    </p>
                  ) : currentInstallmentYearMonth ? (
                    <p className="text-muted-foreground text-[11px]">
                      Esto quiere decir que pagarás la cuota{' '}
                      {parsedCurrentInstallmentNumber}/{parsedInstallments} en{' '}
                      {formatYearMonth(currentInstallmentYearMonth)}
                      {paidInstallments > 0
                        ? ` (las cuotas 1 a ${paidInstallments} ya estarían pagas).`
                        : '.'}
                      {' El día se toma de la fecha informativa elegida.'}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {isEveryday && !isEditing ? (
        <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="quick-recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setIsRecurring(next);
                if (next) setInstallments('1');
              }}
              disabled={isSubmitting}
            />
            <Label htmlFor="quick-recurring">¿Es recurrente?</Label>
          </div>
          {isRecurring ? (
            <div className="space-y-4 border-t pt-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Día del mes
                </Label>
                <DayOfMonthPicker
                  mode="single"
                  value={daysOfMonth}
                  onChange={setDaysOfMonth}
                  disabled={isSubmitting}
                />
                {errors.daysOfMonth ? (
                  <p className="text-destructive text-xs">
                    {errors.daysOfMonth}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-[11px]">
                    Día informativo en el que se debita o vence el compromiso.
                  </p>
                )}
              </div>
              <RecurringMonthsChecklist
                excludedYearMonths={excludedYearMonths}
                onChange={setExcludedYearMonths}
                disabled={isSubmitting}
              />
              {errors.recurringMonths ? (
                <p className="text-destructive text-xs">
                  {errors.recurringMonths}
                </p>
              ) : null}
              <RecurringEscalationFields
                value={recurringEscalation}
                onChange={setRecurringEscalation}
                disabled={isSubmitting}
                currency={expenseCurrency}
                idPrefix="quick-recurring-escalation"
              />
              {errors.escalation ? (
                <p className="text-destructive text-xs">{errors.escalation}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isRecurring ? (
        <>
          <div className="space-y-2">
            <Label
              htmlFor="quick-date"
              className="text-muted-foreground text-xs"
            >
              Fecha
            </Label>
            <Input
              id="quick-date"
              type="date"
              value={expenseDate}
              onChange={(event) => {
                setExpenseDate(event.target.value);
                if (event.target.value) {
                  setPaymentYearMonth(
                    getYearMonthFromIsoDate(event.target.value),
                  );
                }
              }}
              className="rounded-xl"
            />
            <p className="text-muted-foreground text-[11px]">
              Es informativa y no define el mes en el que impacta el gasto.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              Mes de pago *
            </Label>
            <YearMonthSelector
              yearMonth={paymentYearMonth}
              onChange={setPaymentYearMonth}
            />
            {errors.paymentYearMonth ? (
              <p className="text-destructive text-xs">
                {errors.paymentYearMonth}
              </p>
            ) : (
              <p className="text-muted-foreground text-[11px]">
                Elegí explícitamente el mes en el que impacta este gasto.
              </p>
            )}
          </div>
        </>
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

      {isTravel && errors.paidBy && !showTravelOptions ? (
        <p className="text-destructive text-xs">{errors.paidBy}</p>
      ) : null}

      {isEveryday && !isEditing && onOpenSimulator ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() =>
            onOpenSimulator({
              label: note,
              totalAmount: expenseCurrency === boardCurrency ? amount : '',
              startYearMonth: paymentYearMonth,
            })
          }
        >
          <Calculator className="mr-2 size-4" />
          Simular compra en cuotas
        </Button>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || (isTravel && travelDataLoading)}
        className="h-12 rounded-2xl bg-[var(--signal)] text-base font-semibold text-white dark:text-background hover:bg-[color-mix(in_oklab,var(--signal)_88%,black)]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Guardando…
          </>
        ) : isEditing ? (
          'Actualizar gasto'
        ) : isRecurring && isEveryday ? (
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
