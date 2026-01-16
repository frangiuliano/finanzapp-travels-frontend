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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Budget } from '@/types/budget';
import { Participant } from '@/types/participant';
import {
  Expense,
  ExpenseStatus,
  SplitType,
  CreateExpenseDto,
  UpdateExpenseDto,
  PaymentMethod,
} from '@/types/expense';
import { expensesService } from '@/services/expensesService';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { Card } from '@/types/card';
import { cardsService } from '@/services/cardsService';
import { ManageCardsDialog } from '@/components/manage-cards-dialog';
import { Plus } from 'lucide-react';

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  budgets: Budget[];
  participants: Participant[];
  expense?: Expense | null;
  onSuccess?: () => void;
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  tripId,
  budgets,
  participants,
  expense,
  onSuccess,
}: CreateExpenseDialogProps) {
  const [budgetId, setBudgetId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [paidByType, setPaidByType] = useState<'participant' | 'thirdParty'>(
    'participant',
  );
  const [paidByParticipantId, setPaidByParticipantId] = useState('');
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [thirdPartyEmail, setThirdPartyEmail] = useState('');
  const [status, setStatus] = useState<ExpenseStatus>(ExpenseStatus.PAID);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [cardId, setCardId] = useState('');
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isDivisible, setIsDivisible] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [manualSplits, setManualSplits] = useState<
    Record<string, { amount: string; enabled: boolean }>
  >({});
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCards = async () => {
    if (!tripId) return;
    try {
      const result = await cardsService.getCardsByTrip(tripId);
      console.log('Tarjetas cargadas para el viaje:', result.cards);
      setAvailableCards(result.cards || []);
    } catch (error) {
      console.error('Error al cargar tarjetas:', error);
      setAvailableCards([]);
    }
  };

  useEffect(() => {
    if (open && tripId) {
      fetchCards();
    } else {
      setAvailableCards([]);
      setCardId('');
    }
  }, [open, tripId]);

  useEffect(() => {
    if (expense) {
      setBudgetId(expense.budgetId || '');
      setAmount(expense.amount.toString());
      setDescription(expense.description);
      setMerchantName(expense.merchantName || '');
      setCategory(expense.category || '');
      setTags(expense.tags?.join(', ') || '');
      setStatus(expense.status);
      setPaymentMethod(expense.paymentMethod || PaymentMethod.CASH);
      setCardId(expense.cardId || '');
      setIsDivisible(expense.isDivisible || false);
      setSplitType(expense.splitType || SplitType.EQUAL);
      setExpenseDate(
        expense.expenseDate
          ? new Date(expense.expenseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      );

      if (expense.paidByParticipant || expense.paidByParticipantId) {
        setPaidByType('participant');
        const participantId =
          expense.paidByParticipant?._id || expense.paidByParticipantId;
        if (participantId) {
          setPaidByParticipantId(participantId.toString());
        }
      } else if (expense.paidByThirdParty) {
        setPaidByType('thirdParty');
        setThirdPartyName(expense.paidByThirdParty.name);
        setThirdPartyEmail(expense.paidByThirdParty.email || '');
      }

      // Configurar splits si el gasto es divisible
      if (expense.isDivisible && expense.splits) {
        const splits: Record<string, { amount: string; enabled: boolean }> = {};
        expense.splits.forEach((split) => {
          splits[split.participantId] = {
            amount: split.amount.toString(),
            enabled: true,
          };
        });
        setManualSplits(splits);
      } else {
        // Inicializar manualSplits para todos los participantes deshabilitados
        const splits: Record<string, { amount: string; enabled: boolean }> = {};
        participants.forEach((p) => {
          splits[p._id] = { amount: '', enabled: false };
        });
        setManualSplits(splits);
      }
    } else {
      // Reset para nuevo gasto
      setBudgetId(''); // String vacío, se mostrará como "none" en el Select
      setAmount('');
      setDescription('');
      setMerchantName('');
      setCategory('');
      setTags('');
      setPaidByType('participant');
      setPaidByParticipantId(
        participants.length > 0 ? participants[0]._id : '',
      );
      setThirdPartyName('');
      setThirdPartyEmail('');
      setStatus(ExpenseStatus.PAID);
      setPaymentMethod(PaymentMethod.CASH);
      setCardId('');
      setIsDivisible(false);
      setSplitType(SplitType.EQUAL);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      // Inicializar manualSplits para todos los participantes deshabilitados
      const splits: Record<string, { amount: string; enabled: boolean }> = {};
      participants.forEach((p) => {
        splits[p._id] = { amount: '', enabled: false };
      });
      setManualSplits(splits);
    }
    setErrors({});
  }, [expense, open, budgets, participants]);

  const getParticipantName = (participant: Participant): string => {
    if (participant.guestName) {
      return participant.guestName;
    }
    if (typeof participant.userId === 'object' && participant.userId) {
      return `${participant.userId.firstName} ${participant.userId.lastName}`;
    }
    return 'Usuario';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount.trim()) {
      newErrors.amount = 'El monto es obligatorio';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'El monto debe ser un número mayor a 0';
      }
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (description.trim().length < 3) {
      newErrors.description = 'La descripción debe tener al menos 3 caracteres';
    }

    if (paidByType === 'participant' && !paidByParticipantId) {
      newErrors.paidBy = 'Debes seleccionar quién pagó';
    }

    if (paidByType === 'thirdParty') {
      if (!thirdPartyName.trim()) {
        newErrors.thirdPartyName = 'El nombre del tercero es obligatorio';
      } else if (thirdPartyName.trim().length < 2) {
        newErrors.thirdPartyName = 'El nombre debe tener al menos 2 caracteres';
      }
    }

    if (paymentMethod === PaymentMethod.CARD && !cardId) {
      newErrors.cardId = 'Debes seleccionar una tarjeta';
    }

    // Validar división solo si isDivisible es true
    if (isDivisible) {
      const enabledSplits = Object.entries(manualSplits).filter(
        ([, value]) => value.enabled,
      );
      if (enabledSplits.length === 0) {
        newErrors.splits = 'Debes incluir al menos un participante';
      } else {
        const expenseAmount = parseFloat(amount) || 0;

        if (splitType === SplitType.MANUAL) {
          const totalManualAmount = enabledSplits.reduce((sum, [, value]) => {
            const amount = parseFloat(value.amount);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          if (Math.abs(totalManualAmount - expenseAmount) > 0.01) {
            newErrors.splits = `La suma de las divisiones (${totalManualAmount.toFixed(
              2,
            )}) debe ser igual al monto total (${expenseAmount.toFixed(2)})`;
          }

          // Validar que cada split tenga un monto válido
          for (const [participantId, value] of enabledSplits) {
            const amount = parseFloat(value.amount);
            if (isNaN(amount) || amount <= 0) {
              newErrors[`split-${participantId}`] =
                'El monto debe ser mayor a 0';
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEqualSplits = (totalAmount: number) => {
    const enabledParticipants = participants.filter(
      (p) => manualSplits[p._id]?.enabled,
    );
    if (enabledParticipants.length === 0) return [];

    const amountPerParticipant = totalAmount / enabledParticipants.length;
    return enabledParticipants.map((p) => ({
      participantId: p._id,
      amount: parseFloat(amountPerParticipant.toFixed(2)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const numAmount = parseFloat(amount);
      const splits = isDivisible
        ? splitType === SplitType.EQUAL
          ? calculateEqualSplits(numAmount)
          : Object.entries(manualSplits)
              .filter(([, value]) => value.enabled)
              .map(([participantId, value]) => ({
                participantId,
                amount: parseFloat(value.amount),
              }))
        : undefined;

      const baseData = {
        budgetId: budgetId || undefined,
        amount: numAmount,
        currency: DEFAULT_CURRENCY,
        description: description.trim(),
        merchantName: merchantName.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.trim()
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : undefined,
        paidByParticipantId:
          paidByType === 'participant' ? paidByParticipantId : undefined,
        paidByThirdParty:
          paidByType === 'thirdParty'
            ? {
                name: thirdPartyName.trim(),
                email: thirdPartyEmail.trim() || undefined,
              }
            : undefined,
        status,
        paymentMethod,
        cardId: paymentMethod === PaymentMethod.CARD ? cardId : undefined,
        isDivisible,
        splitType: isDivisible ? splitType : undefined,
        splits,
        expenseDate: expenseDate
          ? new Date(expenseDate).toISOString()
          : undefined,
      };

      if (expense) {
        const updateData: UpdateExpenseDto = baseData;
        await expensesService.updateExpense(expense._id, updateData);
        toast.success('Gasto actualizado exitosamente');
      } else {
        const createData: CreateExpenseDto = {
          ...baseData,
          tripId,
        };
        await expensesService.createExpense(createData);
        toast.success('Gasto creado exitosamente');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: Record<string, string>;
      }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        (expense ? 'Error al actualizar el gasto' : 'Error al crear el gasto');
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
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (isDivisible && splitType === SplitType.EQUAL) {
      const numAmount = parseFloat(value) || 0;
      const enabledCount = Object.values(manualSplits).filter(
        (v) => v.enabled,
      ).length;
      if (enabledCount > 0) {
        const amountPerParticipant = numAmount / enabledCount;
        const newSplits = { ...manualSplits };
        participants.forEach((p) => {
          if (newSplits[p._id]?.enabled) {
            newSplits[p._id] = {
              ...newSplits[p._id],
              amount: amountPerParticipant.toFixed(2),
            };
          }
        });
        setManualSplits(newSplits);
      }
    }
  };

  const handleSplitTypeChange = (value: SplitType) => {
    setSplitType(value);
    if (isDivisible && value === SplitType.EQUAL) {
      const numAmount = parseFloat(amount) || 0;
      const enabledCount = Object.values(manualSplits).filter(
        (v) => v.enabled,
      ).length;
      if (enabledCount > 0) {
        const amountPerParticipant = numAmount / enabledCount;
        const newSplits = { ...manualSplits };
        participants.forEach((p) => {
          if (newSplits[p._id]?.enabled) {
            newSplits[p._id] = {
              ...newSplits[p._id],
              amount: amountPerParticipant.toFixed(2),
            };
          }
        });
        setManualSplits(newSplits);
      }
    }
  };

  const handleParticipantToggle = (participantId: string, enabled: boolean) => {
    if (!isDivisible) return;

    const newSplits = { ...manualSplits };
    if (!newSplits[participantId]) {
      newSplits[participantId] = { amount: '', enabled: true };
    }
    newSplits[participantId].enabled = enabled;

    if (splitType === SplitType.EQUAL && enabled) {
      const numAmount = parseFloat(amount) || 0;
      const enabledCount = Object.values(newSplits).filter(
        (v) => v.enabled,
      ).length;
      if (enabledCount > 0) {
        const amountPerParticipant = numAmount / enabledCount;
        Object.keys(newSplits).forEach((pid) => {
          if (newSplits[pid].enabled) {
            newSplits[pid].amount = amountPerParticipant.toFixed(2);
          }
        });
      }
    }

    setManualSplits(newSplits);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Crear Nuevo Gasto'}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? 'Modifica la información del gasto.'
              : 'Completa la información para registrar un nuevo gasto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetId">
                Presupuesto{' '}
                <span className="text-muted-foreground">(Bucket)</span>
                <span className="text-xs text-muted-foreground ml-1">
                  (Opcional)
                </span>
              </Label>
              <Select
                value={budgetId || 'none'}
                onValueChange={(value) =>
                  setBudgetId(value === 'none' ? '' : value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin presupuesto (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin presupuesto</SelectItem>
                  {budgets.map((budget) => (
                    <SelectItem key={budget._id} value={budget._id}>
                      {budget.name} ({budget.currency}{' '}
                      {budget.amount.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.budgetId && (
                <p className="text-sm text-destructive">{errors.budgetId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Almuerzo en restaurante"
              disabled={isLoading}
              autoFocus
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchantName">Nombre del Comercio</Label>
              <Input
                id="merchantName"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Ej: Restaurante XYZ"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Comida, Transporte"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separados por comas)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: trabajo, importante, reembolsable"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseDate">Fecha del Gasto</Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Tabs
            value={paidByType}
            onValueChange={(value) =>
              setPaidByType(value as 'participant' | 'thirdParty')
            }
          >
            <TabsList>
              <TabsTrigger value="participant">
                Pagado por Participante
              </TabsTrigger>
              <TabsTrigger value="thirdParty">Pagado por Tercero</TabsTrigger>
            </TabsList>
            <TabsContent value="participant" className="space-y-2">
              <Label htmlFor="paidByParticipantId">Participante *</Label>
              <Select
                value={paidByParticipantId}
                onValueChange={setPaidByParticipantId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un participante" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((participant) => (
                    <SelectItem key={participant._id} value={participant._id}>
                      {getParticipantName(participant)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paidBy && (
                <p className="text-sm text-destructive">{errors.paidBy}</p>
              )}
            </TabsContent>
            <TabsContent value="thirdParty" className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="thirdPartyName">Nombre del Tercero *</Label>
                <Input
                  id="thirdPartyName"
                  value={thirdPartyName}
                  onChange={(e) => setThirdPartyName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={isLoading}
                />
                {errors.thirdPartyName && (
                  <p className="text-sm text-destructive">
                    {errors.thirdPartyName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="thirdPartyEmail">Email del Tercero</Label>
                <Input
                  id="thirdPartyEmail"
                  type="email"
                  value={thirdPartyEmail}
                  onChange={(e) => setThirdPartyEmail(e.target.value)}
                  placeholder="Ej: juan@example.com"
                  disabled={isLoading}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ExpenseStatus)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpenseStatus.PAID}>Pagado</SelectItem>
                <SelectItem value={ExpenseStatus.PENDING}>Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as PaymentMethod);
                if (value === PaymentMethod.CASH) {
                  setCardId('');
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.CASH}>Efectivo</SelectItem>
                <SelectItem value={PaymentMethod.CARD}>Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === PaymentMethod.CARD && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cardId">Tarjeta *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsCardsDialogOpen(true)}
                  className="h-auto p-0 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Tarjeta
                </Button>
              </div>
              <Select
                value={cardId}
                onValueChange={setCardId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {availableCards.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay tarjetas disponibles
                    </div>
                  ) : (
                    availableCards.map((card) => (
                      <SelectItem key={card._id} value={card._id}>
                        {card.name} (****{card.lastFourDigits})
                        {card.user &&
                          ` - ${card.user.firstName} ${card.user.lastName}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.cardId && (
                <p className="text-sm text-destructive">{errors.cardId}</p>
              )}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDivisible"
                checked={isDivisible}
                onCheckedChange={(checked) => {
                  const newValue = checked as boolean;
                  setIsDivisible(newValue);
                  if (!newValue) {
                    // Reset splits si se desmarca
                    setSplitType(SplitType.EQUAL);
                    const splits: Record<
                      string,
                      { amount: string; enabled: boolean }
                    > = {};
                    participants.forEach((p) => {
                      splits[p._id] = { amount: '', enabled: false };
                    });
                    setManualSplits(splits);
                  } else {
                    // Inicializar splits si se marca
                    setSplitType(SplitType.EQUAL);
                    const splits: Record<
                      string,
                      { amount: string; enabled: boolean }
                    > = {};
                    participants.forEach((p) => {
                      splits[p._id] = { amount: '', enabled: true };
                    });
                    // Calcular división igual si hay monto
                    const numAmount = parseFloat(amount) || 0;
                    if (numAmount > 0 && participants.length > 0) {
                      const amountPerParticipant =
                        numAmount / participants.length;
                      Object.keys(splits).forEach((pid) => {
                        splits[pid].amount = amountPerParticipant.toFixed(2);
                      });
                    }
                    setManualSplits(splits);
                  }
                }}
                disabled={isLoading}
              />
              <Label htmlFor="isDivisible" className="cursor-pointer">
                Divisible entre participantes
              </Label>
            </div>
          </div>

          {isDivisible && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Tipo de División</Label>
                <Select
                  value={splitType}
                  onValueChange={(value) =>
                    handleSplitTypeChange(value as SplitType)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SplitType.EQUAL}>
                      Igual entre todos
                    </SelectItem>
                    <SelectItem value={SplitType.MANUAL}>Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dividir entre:</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                  {participants.map((participant) => {
                    const split = manualSplits[participant._id] || {
                      amount: '',
                      enabled: splitType === SplitType.EQUAL,
                    };
                    return (
                      <div
                        key={participant._id}
                        className="flex items-center gap-4 py-2 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={split.enabled}
                          onCheckedChange={(checked) =>
                            handleParticipantToggle(
                              participant._id,
                              checked as boolean,
                            )
                          }
                          disabled={isLoading}
                        />
                        <div className="flex-1">
                          <Label className="font-normal cursor-pointer">
                            {getParticipantName(participant)}
                          </Label>
                        </div>
                        {splitType === SplitType.MANUAL && split.enabled && (
                          <div className="w-32">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={split.amount}
                              onChange={(e) => {
                                const newSplits = { ...manualSplits };
                                if (!newSplits[participant._id]) {
                                  newSplits[participant._id] = {
                                    amount: '',
                                    enabled: true,
                                  };
                                }
                                newSplits[participant._id].amount =
                                  e.target.value;
                                setManualSplits(newSplits);
                              }}
                              placeholder="0.00"
                              disabled={isLoading || !split.enabled}
                            />
                          </div>
                        )}
                        {splitType === SplitType.EQUAL && split.enabled && (
                          <div className="text-sm text-muted-foreground w-32 text-right">
                            {split.amount || '0.00'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.splits && (
                  <p className="text-sm text-destructive">{errors.splits}</p>
                )}
                {Object.keys(errors)
                  .filter((key) => key.startsWith('split-'))
                  .map((key) => (
                    <p key={key} className="text-sm text-destructive">
                      {errors[key]}
                    </p>
                  ))}
              </div>
            </div>
          )}

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
                ? expense
                  ? 'Actualizando...'
                  : 'Creando...'
                : expense
                  ? 'Actualizar Gasto'
                  : 'Crear Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <ManageCardsDialog
        open={isCardsDialogOpen}
        onOpenChange={async (open) => {
          setIsCardsDialogOpen(open);
          if (!open && tripId) {
            // Recargar tarjetas cuando se cierre el diálogo
            try {
              const result = await cardsService.getCardsByTrip(tripId);
              setAvailableCards(result.cards || []);
            } catch (error) {
              console.error('Error al recargar tarjetas:', error);
            }
          }
        }}
        tripId={tripId}
        onSuccess={async () => {
          // Recargar tarjetas después de crear/eliminar
          if (tripId) {
            try {
              const result = await cardsService.getCardsByTrip(tripId);
              setAvailableCards(result.cards || []);
            } catch (error) {
              console.error('Error al recargar tarjetas:', error);
            }
          }
        }}
      />
    </Dialog>
  );
}
