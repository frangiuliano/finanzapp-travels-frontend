import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ChevronDown, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { budgetsService } from '@/services/budgetsService';
import { createExpenseWithOffline } from '@/services/createExpenseWithOffline';
import { participantsService } from '@/services/participantsService';
import { useAuthStore } from '@/store/authStore';
import { Budget } from '@/types/budget';
import { Board } from '@/types/board';
import { CreateExpenseDto, SplitType } from '@/types/expense';
import { Participant } from '@/types/participant';
import {
  PAYMENT_METHOD_KIND_LABELS,
  PaymentMethod,
} from '@/types/payment-method';
import { cn } from '@/lib/utils';

interface QuickExpenseFormProps {
  board: Board;
  onSuccess?: () => void;
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

function formatPaymentMethodLabel(method: PaymentMethod): string {
  const parts = [method.name, PAYMENT_METHOD_KIND_LABELS[method.kind]];
  if (method.lastFourDigits) {
    parts.push(`•••• ${method.lastFourDigits}`);
  }
  return parts.join(' · ');
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

export function QuickExpenseForm({ board, onSuccess }: QuickExpenseFormProps) {
  const user = useAuthStore((state) => state.user);
  const isTravel = board.type === 'travel';

  const { categories, isLoading: categoriesLoading } = useBoardCategories(
    board._id,
  );
  const { paymentMethods, isLoading: paymentLoading } =
    useAvailablePaymentMethods(board._id);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIsoDate());
  const [showDetails, setShowDetails] = useState(false);
  const [showTravelOptions, setShowTravelOptions] = useState(false);
  const [budgetId, setBudgetId] = useState('');
  const [paidByParticipantId, setPaidByParticipantId] = useState('');
  const [isDivisible, setIsDivisible] = useState(false);
  const [splitParticipantIds, setSplitParticipantIds] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [travelDataLoading, setTravelDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = categoriesLoading || paymentLoading;

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === categoryId),
    [categories, categoryId],
  );

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
    if (!isTravel) {
      setParticipants([]);
      setBudgets([]);
      setPaidByParticipantId('');
      setSplitParticipantIds([]);
      setBudgetId('');
      setIsDivisible(false);
      setTravelDataLoading(false);
      return;
    }

    setPaidByParticipantId('');
    setSplitParticipantIds([]);
    setParticipants([]);
    setBudgets([]);
    setBudgetId('');
    setIsDivisible(false);

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
  }, [board._id, isTravel, user?.id]);

  const resetForm = useCallback(() => {
    setAmount('');
    setNote('');
    setExpenseDate(todayIsoDate());
    setShowDetails(false);
    setShowTravelOptions(false);
    setBudgetId('');
    setIsDivisible(false);
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
  }, [categories, paymentMethods, isTravel, participants, user?.id]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!amount.trim()) {
      nextErrors.amount = 'El monto es obligatorio';
    } else {
      const numAmount = parseFloat(amount);
      if (Number.isNaN(numAmount) || numAmount <= 0) {
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

    if (isTravel && !paidByParticipantId) {
      nextErrors.paidBy = 'Seleccioná quién pagó';
    }

    if (isTravel && isDivisible && splitParticipantIds.length === 0) {
      nextErrors.splits = 'Incluí al menos un participante en el split';
    }

    setErrors(nextErrors);

    if (nextErrors.note) {
      setShowDetails(true);
    }
    if (nextErrors.paidBy || nextErrors.splits) {
      setShowTravelOptions(true);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const numAmount = parseFloat(amount);
      const description = note.trim() || selectedCategory?.name || 'Gasto';

      const payload: CreateExpenseDto = {
        boardId: board._id,
        amount: numAmount,
        currency: board.baseCurrency,
        description,
        categoryId,
        paymentMethodId,
        expenseDate: localDateToIso(expenseDate),
      };

      if (isTravel) {
        payload.paidByParticipantId = paidByParticipantId;
        if (budgetId && budgetId !== 'none') {
          payload.budgetId = budgetId;
        }
        payload.isDivisible = isDivisible;
        if (isDivisible) {
          payload.splitType = SplitType.EQUAL;
          payload.splits = splitParticipantIds.map((participantId) => ({
            participantId,
            amount: 0,
          }));
        }
      }

      const result = await createExpenseWithOffline(payload);
      if (result.mode === 'queued') {
        toast.success('Gasto guardado. Se sincronizará al volver la conexión.');
      } else {
        toast.success('Gasto registrado');
      }
      resetForm();
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
          <Link to="/boards/settings">
            <Settings2 className="mr-1.5 size-4" />
            Configurar tablero
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="quick-amount" className="text-muted-foreground text-xs">
          Monto ({board.baseCurrency})
        </Label>
        <Input
          id="quick-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={cn(
            'h-14 rounded-2xl text-2xl font-semibold tabular-nums',
            errors.amount && 'border-destructive',
          )}
          autoFocus
        />
        {errors.amount ? (
          <p className="text-destructive text-xs">{errors.amount}</p>
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
        <Label className="text-muted-foreground text-xs">Medio de pago</Label>
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
        Fecha y nota
      </button>

      {showDetails ? (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-note" className="text-xs">
              Nota (opcional)
            </Label>
            <Input
              id="quick-note"
              placeholder="Ej. almuerzo, taxi al aeropuerto…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn('rounded-xl', errors.note && 'border-destructive')}
              maxLength={500}
            />
            {errors.note ? (
              <p className="text-destructive text-xs">{errors.note}</p>
            ) : (
              <p className="text-muted-foreground text-[11px]">
                Si no escribís nota, usamos el nombre de la categoría.
              </p>
            )}
          </div>
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
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs">
                        División igual entre los seleccionados
                      </p>
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
                      {errors.splits ? (
                        <p className="text-destructive text-xs">
                          {errors.splits}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Para splits manuales o más opciones, usa la gestión completa
                    en{' '}
                    <Link
                      to="/travel"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Viajes
                    </Link>
                    .
                  </p>
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
        ) : (
          'Registrar gasto'
        )}
      </Button>
    </form>
  );
}
