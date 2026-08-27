import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import {
  ArrowDownToLine,
  Landmark,
  Pause,
  Pencil,
  PiggyBank,
  Play,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CURRENCY_OPTIONS } from '@/constants/currencies';
import { parseMoneyInput } from '@/lib/money';
import { wealthService } from '@/services/wealthService';
import { useBoardsStore } from '@/store/boardsStore';
import type {
  FinancialInstrument,
  Holding,
  HoldingType,
  SavingsGoal,
  WealthOverview,
  InvestmentPosition,
  InvestmentTransaction,
  InstrumentType,
} from '@/types/wealth';

type DialogMode =
  | 'holding'
  | 'edit_holding'
  | 'balance'
  | 'goal'
  | 'position'
  | 'price'
  | 'trade'
  | 'edit_transaction'
  | 'contribution'
  | null;

const HOLDING_LABELS: Record<HoldingType, string> = {
  bank_account: 'Cuenta bancaria',
  virtual_wallet: 'Billetera virtual',
  cash: 'Efectivo',
  investment: 'Inversión',
  other: 'Otro',
};

const PACE_LABELS = {
  on_track: 'Al día',
  behind: 'Atrasado',
  no_plan: 'Sin ritmo',
  completed: 'Cumplido',
};

const GOAL_ICONS = [
  '🎯',
  '✈️',
  '🏠',
  '🚗',
  '🛟',
  '🎓',
  '💻',
  '💍',
  '🎁',
  '🏖️',
  '💰',
];

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  stock: 'Acción',
  etf: 'ETF',
  cedear: 'CEDEAR',
  bond: 'Bono',
  mutual_fund: 'Fondo común',
  crypto: 'Criptomoneda',
  other: 'Otro',
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function WealthPage() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const activeBoard = currentBoard ?? boards[0] ?? null;
  const [overview, setOverview] = useState<WealthOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [holdingType, setHoldingType] = useState<HoldingType>('bank_account');
  const [currency, setCurrency] = useState('ARS');
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [priority, setPriority] = useState('5');
  const [icon, setIcon] = useState('🎯');
  const [holdingId, setHoldingId] = useState('');
  const [contributionKind, setContributionKind] = useState<
    'contribution' | 'withdrawal'
  >('contribution');
  const [note, setNote] = useState('');
  const [instruments, setInstruments] = useState<FinancialInstrument[]>([]);
  const [instrumentId, setInstrumentId] = useState('');
  const [instrumentSearch, setInstrumentSearch] = useState('');
  const [isInstrumentSearchOpen, setIsInstrumentSearchOpen] = useState(false);
  const instrumentComboboxRef = useRef<HTMLDivElement>(null);
  const [createCustomInstrument, setCreateCustomInstrument] = useState(false);
  const [instrumentSymbol, setInstrumentSymbol] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('stock');
  const [instrumentExchange, setInstrumentExchange] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedPosition, setSelectedPosition] =
    useState<InvestmentPosition | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<InvestmentTransaction | null>(null);

  const load = useCallback(async () => {
    try {
      if (!activeBoard) return;
      setOverview(await wealthService.getOverview(activeBoard._id));
    } catch {
      toast.error('No se pudo cargar tu patrimonio');
    } finally {
      setIsLoading(false);
    }
  }, [activeBoard]);

  useEffect(() => void load(), [load]);

  const resetForm = () => {
    setName('');
    setInstitution('');
    setHoldingType('bank_account');
    setCurrency('ARS');
    setAmount('');
    setTargetDate('');
    setMonthlyAmount('');
    setPriority('5');
    setIcon('🎯');
    setHoldingId('');
    setContributionKind('contribution');
    setNote('');
    setInstrumentId('');
    setInstrumentSearch('');
    setCreateCustomInstrument(false);
    setInstrumentSymbol('');
    setInstrumentName('');
    setInstrumentType('stock');
    setInstrumentExchange('');
    setQuantity('');
    setUnitPrice('');
    setAverageCost('');
    setTradeType('buy');
    setSelectedPosition(null);
    setSelectedTransaction(null);
    setSelectedHolding(null);
    setSelectedGoal(null);
  };

  const closeDialog = () => {
    setDialogMode(null);
    resetForm();
  };

  const eligibleHoldings = useMemo(
    () =>
      (overview?.holdings ?? []).filter(
        (holding) =>
          holding.currency === selectedGoal?.currency &&
          (contributionKind === 'contribution' ||
            Boolean(
              selectedGoal?.allocations.some(
                (allocation) =>
                  allocation.holdingId === holding._id && allocation.amount > 0,
              ),
            )),
      ),
    [contributionKind, overview?.holdings, selectedGoal],
  );

  useEffect(() => {
    if (
      dialogMode !== 'position' ||
      createCustomInstrument ||
      !selectedHolding ||
      instrumentId
    )
      return;
    const timeout = window.setTimeout(async () => {
      try {
        setInstruments(
          await wealthService.getInstruments(
            instrumentSearch.trim(),
            selectedHolding.currency,
          ),
        );
      } catch {
        toast.error('No se pudo buscar instrumentos');
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    createCustomInstrument,
    dialogMode,
    instrumentId,
    instrumentSearch,
    selectedHolding,
  ]);

  useEffect(() => {
    if (!isInstrumentSearchOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        instrumentComboboxRef.current &&
        !instrumentComboboxRef.current.contains(event.target as Node)
      ) {
        setIsInstrumentSearchOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isInstrumentSearchOpen]);

  const openBalance = (holding: Holding) => {
    resetForm();
    setSelectedHolding(holding);
    setAmount(String(holding.currentBalance).replace('.', ','));
    setDialogMode('balance');
  };

  const openEditHolding = (holding: Holding) => {
    resetForm();
    setSelectedHolding(holding);
    setName(holding.name);
    setInstitution(holding.institution || '');
    setHoldingType(holding.type);
    setDialogMode('edit_holding');
  };

  const openContribution = (goal: SavingsGoal) => {
    resetForm();
    setSelectedGoal(goal);
    const first = (overview?.holdings ?? []).find(
      (holding) =>
        holding.currency === goal.currency && holding.availableBalance > 0,
    );
    setHoldingId(first?._id ?? '');
    setDialogMode('contribution');
  };

  const openPosition = async (holding: Holding) => {
    resetForm();
    setSelectedHolding(holding);
    setDialogMode('position');
    try {
      setInstruments(await wealthService.getInstruments('', holding.currency));
    } catch {
      toast.error('No se pudo cargar el catálogo de instrumentos');
    }
  };

  const openTrade = (position: InvestmentPosition) => {
    resetForm();
    setSelectedPosition(position);
    setSelectedHolding(
      overview?.holdings.find((item) => item._id === position.holdingId) ??
        null,
    );
    setInstrumentId(position.instrumentId._id);
    setUnitPrice(String(position.currentPrice).replace('.', ','));
    setDialogMode('trade');
  };

  const openPrice = (position: InvestmentPosition) => {
    resetForm();
    setSelectedPosition(position);
    setUnitPrice(String(position.currentPrice).replace('.', ','));
    setDialogMode('price');
  };

  const refreshPositionPrice = async () => {
    if (!selectedPosition) return;
    setIsSaving(true);
    try {
      const result = await wealthService.refreshPositionPrice(
        activeBoard!._id,
        selectedPosition._id,
      );
      setUnitPrice(String(result.currentPrice).replace('.', ','));
      toast.success('Cotización actualizada');
      closeDialog();
      setIsLoading(true);
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo obtener la cotización automática',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openEditTransaction = async (
    holding: Holding,
    transaction: InvestmentTransaction,
  ) => {
    resetForm();
    setSelectedHolding(holding);
    setSelectedTransaction(transaction);
    setInstrumentId(transaction.instrumentId);
    setTradeType(transaction.type);
    setQuantity(String(transaction.quantity).replace('.', ','));
    setUnitPrice(String(transaction.unitPrice).replace('.', ','));
    setDialogMode('edit_transaction');
    try {
      setInstruments(await wealthService.getInstruments('', holding.currency));
    } catch {
      toast.error('No se pudo cargar el catálogo de instrumentos');
    }
  };

  const submit = async () => {
    const parsedAmount = parseMoneyInput(amount);
    setIsSaving(true);
    try {
      if (dialogMode === 'holding') {
        if (!name.trim() || parsedAmount === null) {
          throw new Error('Completá el nombre y el saldo');
        }
        await wealthService.createHolding(activeBoard!._id, {
          name: name.trim(),
          institution: institution.trim() || undefined,
          type: holdingType,
          currency,
          currentBalance: parsedAmount,
        });
        toast.success('Tenencia agregada');
      } else if (dialogMode === 'edit_holding' && selectedHolding) {
        if (!name.trim()) throw new Error('Ingresá un nombre');
        await wealthService.updateHolding(
          activeBoard!._id,
          selectedHolding._id,
          {
            name: name.trim(),
            institution: institution.trim(),
          },
        );
        toast.success('Tenencia actualizada');
      } else if (dialogMode === 'balance' && selectedHolding) {
        if (parsedAmount === null) throw new Error('Ingresá el saldo actual');
        await wealthService.adjustBalance(
          activeBoard!._id,
          selectedHolding._id,
          {
            balance: parsedAmount,
            note: note.trim() || undefined,
          },
        );
        toast.success('Saldo actualizado');
      } else if (dialogMode === 'goal') {
        if (!name.trim() || parsedAmount === null || parsedAmount <= 0) {
          throw new Error('Completá el nombre y el monto objetivo');
        }
        await wealthService.createGoal(activeBoard!._id, {
          name: name.trim(),
          targetAmount: parsedAmount,
          currency,
          targetDate: targetDate || undefined,
          plannedMonthlyContribution:
            parseMoneyInput(monthlyAmount) ?? undefined,
          priority: Math.min(10, Math.max(1, Number(priority) || 5)),
          icon: icon.trim() || undefined,
        });
        toast.success('Objetivo creado');
      } else if (dialogMode === 'contribution' && selectedGoal) {
        if (!holdingId || parsedAmount === null || parsedAmount <= 0) {
          throw new Error('Elegí una tenencia e ingresá un importe');
        }
        await wealthService.contribute(activeBoard!._id, selectedGoal._id, {
          holdingId,
          kind: contributionKind,
          amount: parsedAmount,
          note: note.trim() || undefined,
        });
        toast.success(
          contributionKind === 'contribution'
            ? 'Aporte registrado'
            : 'Dinero liberado',
        );
      } else if (dialogMode === 'position' && selectedHolding) {
        const parsedQuantity = Number(quantity.replace(',', '.'));
        const parsedPrice = parseMoneyInput(averageCost);
        let resolvedInstrumentId = instrumentId;
        if (createCustomInstrument) {
          if (!instrumentSymbol.trim() || !instrumentName.trim()) {
            throw new Error('Completá símbolo y nombre del instrumento');
          }
          const created = await wealthService.createInstrument({
            symbol: instrumentSymbol.trim(),
            name: instrumentName.trim(),
            type: instrumentType,
            currency: selectedHolding.currency,
            exchange: instrumentExchange.trim() || undefined,
          });
          resolvedInstrumentId = created._id;
        }
        if (
          !resolvedInstrumentId ||
          parsedQuantity <= 0 ||
          parsedPrice === null
        ) {
          throw new Error('Completá instrumento, cantidad y precio de compra');
        }
        await wealthService.createPosition(
          activeBoard!._id,
          selectedHolding._id,
          {
            instrumentId: resolvedInstrumentId,
            quantity: parsedQuantity,
            unitPrice: parsedPrice,
          },
        );
        toast.success('Posición agregada');
      } else if (
        dialogMode === 'trade' &&
        selectedHolding &&
        selectedPosition
      ) {
        const parsedQuantity = Number(quantity.replace(',', '.'));
        const parsedPrice = parseMoneyInput(unitPrice);
        if (parsedQuantity <= 0 || parsedPrice === null) {
          throw new Error('Completá nominales y precio');
        }
        await wealthService.trade(activeBoard!._id, selectedHolding._id, {
          instrumentId: selectedPosition.instrumentId._id,
          type: tradeType,
          quantity: parsedQuantity,
          unitPrice: parsedPrice,
        });
        toast.success(
          tradeType === 'buy' ? 'Compra registrada' : 'Venta registrada',
        );
      } else if (dialogMode === 'price' && selectedPosition) {
        const parsedPrice = parseMoneyInput(unitPrice);
        if (parsedPrice === null) throw new Error('Ingresá el precio actual');
        await wealthService.updatePositionPrice(
          activeBoard!._id,
          selectedPosition._id,
          parsedPrice,
        );
        toast.success('Precio actualizado');
      } else if (dialogMode === 'edit_transaction' && selectedTransaction) {
        const parsedQuantity = Number(quantity.replace(',', '.'));
        const parsedPrice = parseMoneyInput(unitPrice);
        if (!instrumentId || parsedQuantity <= 0 || parsedPrice === null) {
          throw new Error('Completá instrumento, cantidad y precio');
        }
        await wealthService.updateTransaction(
          activeBoard!._id,
          selectedTransaction._id,
          {
            instrumentId,
            type: tradeType,
            quantity: parsedQuantity,
            unitPrice: parsedPrice,
          },
        );
        toast.success('Operación corregida');
      }
      closeDialog();
      setIsLoading(true);
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : 'No se pudo guardar'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = async (transaction: InvestmentTransaction) => {
    if (!confirm('¿Eliminar esta operación? La posición será recalculada.'))
      return;
    try {
      await wealthService.deleteTransaction(activeBoard!._id, transaction._id);
      toast.success('Operación eliminada');
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo eliminar la operación',
      );
    }
  };

  const toggleGoal = async (goal: SavingsGoal) => {
    try {
      await wealthService.updateGoal(activeBoard!._id, goal._id, {
        status: goal.status === 'paused' ? 'active' : 'paused',
      });
      await load();
    } catch {
      toast.error('No se pudo actualizar el objetivo');
    }
  };

  const archiveHolding = async (holding: Holding) => {
    if (
      !confirm(`¿Eliminar "${holding.name}"? El historial quedará preservado.`)
    ) {
      return;
    }
    try {
      await wealthService.archiveHolding(activeBoard!._id, holding._id);
      toast.success('Tenencia eliminada');
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo eliminar la tenencia',
      );
    }
  };

  const archiveGoal = async (goal: SavingsGoal) => {
    if (
      !confirm(
        `¿Eliminar el objetivo "${goal.name}"? El historial quedará preservado.`,
      )
    ) {
      return;
    }
    try {
      await wealthService.archiveGoal(activeBoard!._id, goal._id);
      toast.success('Objetivo eliminado');
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo eliminar el objetivo',
      );
    }
  };

  if (isLoading && !overview) {
    return (
      <div className="w-full flex-1 space-y-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 px-4 py-6 pb-28 lg:px-6 md:pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Patrimonio
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu dinero, tus objetivos y el avance real de cada ahorro.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void load()}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(overview?.totalsByCurrency ?? {}).map(
          ([totalCurrency, total]) => (
            <Card key={totalCurrency}>
              <CardHeader className="pb-2">
                <CardDescription>Total en {totalCurrency}</CardDescription>
                <CardTitle>{money(total.balance, totalCurrency)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {money(total.allocated, totalCurrency)} asignado ·{' '}
                {money(total.available, totalCurrency)} libre
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Tabs defaultValue="holdings">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="holdings">Tenencias</TabsTrigger>
          <TabsTrigger value="investments">Inversiones</TabsTrigger>
          <TabsTrigger value="goals">Objetivos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Mis ahorros
              </h2>
              <p className="text-xs text-muted-foreground">
                Actualizá los saldos para mantener el patrimonio al día.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogMode('holding')}>
              <Plus className="mr-1 size-4" /> Agregar
            </Button>
          </div>
          {overview?.holdings.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {overview.holdings.map((holding) => (
                <Card key={holding._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {holding.name}
                        </CardTitle>
                        <CardDescription>
                          {holding.institution || HOLDING_LABELS[holding.type]}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {holding.type === 'bank_account' ? (
                          <Landmark className="size-5 text-primary" />
                        ) : (
                          <WalletCards className="size-5 text-primary" />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditHolding(holding)}
                          aria-label={`Editar ${holding.name}`}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void archiveHolding(holding)}
                          aria-label={`Eliminar ${holding.name}`}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xl font-semibold tabular-nums">
                      {money(holding.currentBalance, holding.currency)}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Asignado{' '}
                        {money(holding.allocatedBalance, holding.currency)}
                      </span>
                      <span>
                        Libre{' '}
                        {money(holding.availableBalance, holding.currency)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openBalance(holding)}
                    >
                      {holding.type === 'investment'
                        ? 'Actualizar efectivo'
                        : 'Actualizar saldo'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="Todavía no cargaste ahorros"
              text="Agregá cuentas, billeteras, efectivo o inversiones."
            />
          )}
        </TabsContent>

        <TabsContent value="investments" className="mt-5 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Mis inversiones
            </h2>
            <p className="text-xs text-muted-foreground">
              Registrá instrumentos, nominales y precios. La valuación se suma
              automáticamente al resumen de Patrimonio.
            </p>
          </div>
          {overview?.holdings.some(
            (holding) => holding.type === 'investment',
          ) ? (
            <div className="space-y-4">
              {overview.holdings
                .filter((holding) => holding.type === 'investment')
                .map((holding) => {
                  const positions = overview.investmentPositions.filter(
                    (position) => position.holdingId === holding._id,
                  );
                  return (
                    <Card key={holding._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">
                              {holding.name}
                            </CardTitle>
                            <CardDescription>
                              {holding.institution || 'Cuenta de inversión'} ·{' '}
                              Efectivo{' '}
                              {money(
                                holding.cashBalance ?? 0,
                                holding.currency,
                              )}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold tabular-nums">
                              {money(holding.currentBalance, holding.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              valuación total
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {positions.length ? (
                          positions.map((position) => {
                            const marketValue =
                              position.quantity * position.currentPrice;
                            const result =
                              marketValue -
                              position.quantity * position.averageCost;
                            const transactions = (
                              overview.investmentTransactions ?? []
                            )
                              .filter(
                                (transaction) =>
                                  transaction.instrumentId ===
                                    position.instrumentId._id &&
                                  transaction.holdingId === holding._id,
                              )
                              .slice(0, 5);
                            return (
                              <div
                                key={position._id}
                                className="rounded-xl border p-3"
                              >
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                                  <div>
                                    <p className="font-medium">
                                      {position.instrumentId.symbol}{' '}
                                      <Badge
                                        variant="secondary"
                                        className="ml-1"
                                      >
                                        {
                                          INSTRUMENT_LABELS[
                                            position.instrumentId.type
                                          ]
                                        }
                                      </Badge>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {position.instrumentId.name} ·{' '}
                                      {position.quantity.toLocaleString(
                                        'es-AR',
                                        { maximumFractionDigits: 8 },
                                      )}{' '}
                                      unidades
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Costo promedio{' '}
                                      {money(
                                        position.averageCost,
                                        holding.currency,
                                      )}{' '}
                                      · Precio actual{' '}
                                      {money(
                                        position.currentPrice,
                                        holding.currency,
                                      )}
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="font-medium tabular-nums">
                                      {money(marketValue, holding.currency)}
                                    </p>
                                    <p
                                      className={`text-xs ${
                                        result >= 0
                                          ? 'text-emerald-600'
                                          : 'text-destructive'
                                      }`}
                                    >
                                      {result >= 0 ? '+' : ''}
                                      {money(result, holding.currency)}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPrice(position)}
                                    >
                                      Actualizar precio
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openTrade(position)}
                                    >
                                      Comprar / vender
                                    </Button>
                                  </div>
                                </div>
                                {transactions.length ? (
                                  <div className="mt-3 border-t pt-2">
                                    <p className="mb-1 text-xs font-medium">
                                      Últimas operaciones
                                    </p>
                                    <div className="space-y-1">
                                      {transactions.map((transaction) => (
                                        <div
                                          key={transaction._id}
                                          className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
                                        >
                                          <span>
                                            {transaction.type === 'buy'
                                              ? 'Compra'
                                              : 'Venta'}{' '}
                                            ·{' '}
                                            {transaction.quantity.toLocaleString(
                                              'es-AR',
                                              { maximumFractionDigits: 8 },
                                            )}{' '}
                                            unidades a{' '}
                                            {money(
                                              transaction.unitPrice,
                                              holding.currency,
                                            )}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <span>
                                              {new Date(
                                                transaction.occurredAt,
                                              ).toLocaleDateString('es-AR')}
                                            </span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="size-7"
                                              aria-label="Editar operación"
                                              onClick={() =>
                                                void openEditTransaction(
                                                  holding,
                                                  transaction,
                                                )
                                              }
                                            >
                                              <Pencil className="size-3.5" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="size-7 text-destructive"
                                              aria-label="Eliminar operación"
                                              onClick={() =>
                                                void deleteTransaction(
                                                  transaction,
                                                )
                                              }
                                            >
                                              <Trash2 className="size-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Todavía no registraste instrumentos en esta cuenta.
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void openPosition(holding)}
                        >
                          <Plus className="mr-1 size-4" /> Agregar posición
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="Creá una tenencia de inversión"
              text="Después vas a poder agregar acciones, ETF, CEDEAR, bonos y otros instrumentos."
            />
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Objetivos</h2>
              <p className="text-xs text-muted-foreground">
                Cada aporte reserva dinero real de una tenencia.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogMode('goal')}>
              <Plus className="mr-1 size-4" /> Crear
            </Button>
          </div>
          {overview?.goals.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {overview.goals.map((goal) => (
                <Card
                  key={goal._id}
                  className={goal.status === 'paused' ? 'opacity-70' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <span className="text-xl">{goal.icon || '🎯'}</span>
                        <div>
                          <CardTitle className="text-base">
                            {goal.name}
                          </CardTitle>
                          <CardDescription>
                            Prioridad {goal.priority}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          goal.paceStatus === 'behind'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {PACE_LABELS[goal.paceStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <strong>
                          {money(goal.allocatedAmount, goal.currency)}
                        </strong>
                        <span className="text-muted-foreground">
                          de {money(goal.targetAmount, goal.currency)}
                        </span>
                      </div>
                      <Progress
                        value={goal.progressPercent}
                        className="h-2.5"
                      />
                      <p className="mt-1 text-right text-xs font-medium">
                        {goal.progressPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Metric
                        label="Falta"
                        value={money(goal.remainingAmount, goal.currency)}
                      />
                      <Metric
                        label="Necesario por mes"
                        value={
                          goal.requiredMonthlyContribution === null
                            ? 'Sin fecha límite'
                            : money(
                                goal.requiredMonthlyContribution,
                                goal.currency,
                              )
                        }
                      />
                      <Metric
                        label="Ritmo mensual"
                        value={money(
                          goal.actualMonthlyContribution,
                          goal.currency,
                        )}
                      />
                      <Metric
                        label="Fecha estimada"
                        value={
                          goal.estimatedCompletionDate
                            ? monthLabel(goal.estimatedCompletionDate)
                            : 'Sin datos'
                        }
                      />
                    </div>
                    {goal.allocations.length > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {goal.allocations.map((allocation) => {
                          const holding = overview.holdings.find(
                            (item) => item._id === allocation.holdingId,
                          );
                          return (
                            <p key={allocation._id}>
                              {holding?.name || 'Tenencia'}:{' '}
                              {money(allocation.amount, goal.currency)}
                            </p>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => openContribution(goal)}
                        disabled={goal.status === 'paused'}
                      >
                        <ArrowDownToLine className="mr-1 size-4" /> Aportar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void toggleGoal(goal)}
                        title={goal.status === 'paused' ? 'Reanudar' : 'Pausar'}
                      >
                        {goal.status === 'paused' ? (
                          <Play className="size-4" />
                        ) : (
                          <Pause className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void archiveGoal(goal)}
                        title="Eliminar objetivo"
                        aria-label={`Eliminar ${goal.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="Convertí tus ahorros en planes"
              text="Creá varios objetivos y asignales dinero sin duplicarlo."
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
              <CardDescription>
                Historial auditable de saldos y aportes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentEvents.length ? (
                overview.recentEvents.map((event) => {
                  const holding = overview.holdings.find(
                    (item) => item._id === event.holdingId,
                  );
                  const eventGoal = overview.goals.find(
                    (item) => item._id === event.goalId,
                  );
                  return (
                    <div
                      key={event._id}
                      className="flex justify-between gap-3 border-b pb-3 text-sm last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          {event.kind === 'contribution'
                            ? `Aporte a ${eventGoal?.name || 'objetivo'}`
                            : event.kind === 'withdrawal'
                              ? `Retiro de ${eventGoal?.name || 'objetivo'}`
                              : event.kind === 'initial_balance'
                                ? 'Saldo inicial'
                                : 'Actualización de saldo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holding?.name} ·{' '}
                          {new Date(event.occurredAt).toLocaleDateString(
                            'es-AR',
                          )}
                        </p>
                      </div>
                      <span className="tabular-nums">
                        {holding
                          ? money(event.amount, holding.currency)
                          : event.amount}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay actividad.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponsiveFormDialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
        title={
          dialogMode === 'holding'
            ? 'Nueva tenencia'
            : dialogMode === 'edit_holding'
              ? 'Editar tenencia'
              : dialogMode === 'balance'
                ? 'Actualizar saldo'
                : dialogMode === 'goal'
                  ? 'Nuevo objetivo'
                  : dialogMode === 'position'
                    ? 'Agregar posición'
                    : dialogMode === 'price'
                      ? 'Actualizar precio'
                      : dialogMode === 'trade'
                        ? 'Registrar operación'
                        : dialogMode === 'edit_transaction'
                          ? 'Corregir operación'
                          : 'Registrar aporte'
        }
        description={
          dialogMode === 'contribution'
            ? 'El aporte reserva dinero disponible; no modifica el saldo total.'
            : 'Completá los datos para mantener tu patrimonio actualizado.'
        }
      >
        <div className="space-y-4">
          {dialogMode === 'holding' ? (
            <>
              <Field label="Nombre">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Caja de ahorro"
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={holdingType}
                  onValueChange={(value) =>
                    setHoldingType(value as HoldingType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HOLDING_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Institución (opcional)">
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej: Mercado Pago"
                />
              </Field>
              <CurrencyField value={currency} onChange={setCurrency} />
              <AmountField
                label="Saldo actual"
                value={amount}
                onChange={setAmount}
              />
            </>
          ) : null}
          {dialogMode === 'edit_holding' ? (
            <>
              <Field label="Nombre">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Institución (opcional)">
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </Field>
            </>
          ) : null}
          {dialogMode === 'balance' ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedHolding?.name} · No puede quedar por debajo del dinero
                ya asignado.
              </p>
              <AmountField
                label="Nuevo saldo"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Nota (opcional)">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Actualización mensual"
                />
              </Field>
            </>
          ) : null}
          {dialogMode === 'goal' ? (
            <>
              <div className="grid grid-cols-[72px_1fr] gap-3">
                <Field label="Ícono">
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger aria-label="Ícono del objetivo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_ICONS.map((goalIcon) => (
                        <SelectItem key={goalIcon} value={goalIcon}>
                          <span className="text-lg">{goalIcon}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Nombre">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Viaje a Japón"
                  />
                </Field>
              </div>
              <CurrencyField value={currency} onChange={setCurrency} />
              <AmountField
                label="Monto objetivo"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Fecha límite (opcional)">
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </Field>
              <AmountField
                label="Aporte mensual planificado (opcional)"
                value={monthlyAmount}
                onChange={setMonthlyAmount}
              />
              <Field label="Prioridad">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  onBlur={() =>
                    setPriority(
                      String(Math.min(10, Math.max(1, Number(priority) || 5))),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Del 1 al 10: 1 es la prioridad más alta y 10 la más baja.
                </p>
              </Field>
            </>
          ) : null}
          {dialogMode === 'position' ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedHolding?.name} · Los nominales y el precio actual se
                usarán para calcular la valuación.
              </p>
              {createCustomInstrument ? (
                <div className="space-y-4 rounded-xl border p-3">
                  <Field label="Símbolo">
                    <Input
                      value={instrumentSymbol}
                      onChange={(event) =>
                        setInstrumentSymbol(event.target.value.toUpperCase())
                      }
                      placeholder="Ej: KO"
                    />
                  </Field>
                  <Field label="Nombre">
                    <Input
                      value={instrumentName}
                      onChange={(event) =>
                        setInstrumentName(event.target.value)
                      }
                      placeholder="Ej: Coca-Cola"
                    />
                  </Field>
                  <Field label="Tipo de instrumento">
                    <Select
                      value={instrumentType}
                      onValueChange={(value) =>
                        setInstrumentType(value as InstrumentType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INSTRUMENT_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Mercado (opcional)">
                    <Input
                      value={instrumentExchange}
                      onChange={(event) =>
                        setInstrumentExchange(event.target.value)
                      }
                      placeholder="Ej: NASDAQ, BYMA"
                    />
                  </Field>
                </div>
              ) : (
                <>
                  <Field label="Instrumento">
                    <div ref={instrumentComboboxRef} className="relative">
                      <Input
                        role="combobox"
                        aria-expanded={isInstrumentSearchOpen}
                        aria-controls="instrument-results"
                        autoComplete="off"
                        value={instrumentSearch}
                        onFocus={() => setIsInstrumentSearchOpen(true)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setIsInstrumentSearchOpen(false);
                            event.currentTarget.blur();
                          }
                        }}
                        onChange={(event) => {
                          setInstrumentSearch(event.target.value);
                          setInstrumentId('');
                          setIsInstrumentSearchOpen(true);
                        }}
                        placeholder="Buscá por símbolo o nombre, ej: SPY"
                      />
                      {isInstrumentSearchOpen ? (
                        <div
                          id="instrument-results"
                          role="listbox"
                          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                        >
                          {instruments.length ? (
                            instruments.map((instrument) => (
                              <button
                                key={instrument._id}
                                type="button"
                                role="option"
                                aria-selected={instrumentId === instrument._id}
                                className="flex w-full flex-col rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                  setInstrumentId(instrument._id);
                                  setInstrumentSearch(
                                    `${instrument.symbol} · ${instrument.name}`,
                                  );
                                  setIsInstrumentSearchOpen(false);
                                }}
                              >
                                <span className="font-medium">
                                  {instrument.symbol} · {instrument.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {INSTRUMENT_LABELS[instrument.type]}
                                  {instrument.exchange
                                    ? ` · ${instrument.exchange}`
                                    : ''}
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="px-2 py-3 text-sm text-muted-foreground">
                              No se encontraron instrumentos.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Field>
                </>
              )}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  setCreateCustomInstrument((value) => !value);
                  setInstrumentId('');
                }}
              >
                {createCustomInstrument
                  ? 'Elegir del catálogo'
                  : 'No está en el catálogo: crear instrumento'}
              </Button>
              <Field label="Cantidad comprada">
                <Input
                  type="number"
                  min="0.00000001"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Ej: 10"
                />
              </Field>
              <AmountField
                label="Precio de compra por unidad"
                value={averageCost}
                onChange={setAverageCost}
              />
              <p className="text-xs text-muted-foreground">
                El costo promedio se calcula automáticamente con cada compra. El
                precio actual comienza con este valor y después se actualiza una
                sola vez para toda la posición.
              </p>
            </>
          ) : null}
          {dialogMode === 'price' && selectedPosition ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedPosition.instrumentId.symbol} · El nuevo precio
                recalculará la valuación sin registrar una operación.
              </p>
              <AmountField
                label="Precio actual por nominal"
                value={unitPrice}
                onChange={setUnitPrice}
              />
              {selectedPosition.instrumentId.provider === 'twelve_data' ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => void refreshPositionPrice()}
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${isSaving ? 'animate-spin' : ''}`}
                  />
                  Obtener cotización automática
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Este instrumento usa actualización manual.
                </p>
              )}
            </>
          ) : null}
          {dialogMode === 'trade' && selectedPosition ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedPosition.instrumentId.symbol} ·{' '}
                {selectedPosition.quantity.toLocaleString('es-AR', {
                  maximumFractionDigits: 8,
                })}{' '}
                nominales actuales
              </p>
              <Field label="Operación">
                <Select
                  value={tradeType}
                  onValueChange={(value) =>
                    setTradeType(value as 'buy' | 'sell')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Compra</SelectItem>
                    <SelectItem value="sell">Venta</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cantidad de nominales">
                <Input
                  type="number"
                  min="0.00000001"
                  max={
                    tradeType === 'sell' ? selectedPosition.quantity : undefined
                  }
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </Field>
              <AmountField
                label="Precio por nominal"
                value={unitPrice}
                onChange={setUnitPrice}
              />
              {tradeType === 'buy' ? (
                <p className="text-xs text-muted-foreground">
                  La compra se descuenta del efectivo disponible en la cuenta.
                </p>
              ) : null}
            </>
          ) : null}
          {dialogMode === 'edit_transaction' && selectedTransaction ? (
            <>
              <Field label="Instrumento">
                <Select value={instrumentId} onValueChange={setInstrumentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un instrumento" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((instrument) => (
                      <SelectItem key={instrument._id} value={instrument._id}>
                        {instrument.symbol} · {instrument.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Operación">
                <Select
                  value={tradeType}
                  onValueChange={(value) =>
                    setTradeType(value as 'buy' | 'sell')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Compra</SelectItem>
                    <SelectItem value="sell">Venta</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cantidad">
                <Input
                  type="number"
                  min="0.00000001"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </Field>
              <AmountField
                label="Precio por unidad"
                value={unitPrice}
                onChange={setUnitPrice}
              />
              <p className="text-xs text-muted-foreground">
                La cantidad, el costo promedio y el efectivo se recalcularán
                desde el historial completo.
              </p>
            </>
          ) : null}
          {dialogMode === 'contribution' ? (
            <>
              <Field label="Acción">
                <Select
                  value={contributionKind}
                  onValueChange={(value) => {
                    setContributionKind(value as 'contribution' | 'withdrawal');
                    setHoldingId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contribution">
                      Aportar al objetivo
                    </SelectItem>
                    <SelectItem value="withdrawal">
                      Retirar y liberar dinero
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Desde qué tenencia">
                <Select value={holdingId} onValueChange={setHoldingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una tenencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleHoldings.map((holding) => (
                      <SelectItem key={holding._id} value={holding._id}>
                        {holding.name} ·{' '}
                        {contributionKind === 'contribution'
                          ? `libre ${money(holding.availableBalance, holding.currency)}`
                          : `asignado ${money(
                              selectedGoal?.allocations.find(
                                (allocation) =>
                                  allocation.holdingId === holding._id,
                              )?.amount ?? 0,
                              holding.currency,
                            )}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <AmountField
                label="Importe"
                value={amount}
                onChange={setAmount}
              />
              <Field label="Nota (opcional)">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Aporte de agosto"
                />
              </Field>
            </>
          ) : null}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => void submit()}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveFormDialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <MoneyInput value={value} onChange={onChange} />
    </Field>
  );
}

function CurrencyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="Moneda">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof TrendingUp;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
      <Icon className="mb-3 size-8 text-primary" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
