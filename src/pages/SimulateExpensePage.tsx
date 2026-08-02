import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowLeft, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { parseMoneyInput } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { EmptyBoardState } from '@/components/empty-board-state';
import { ExpenseSimulationResults } from '@/components/expense-simulation-results';
import { forecastService } from '@/services/forecastService';
import { useBoardsStore } from '@/store/boardsStore';
import type { ExpenseSimulationResult } from '@/types/expense-simulation';
import { getCurrentYearMonth } from '@/lib/utils';

export default function SimulateExpensePage() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const isLoadingBoards = useBoardsStore((state) => state.isLoading);
  const activeBoard = currentBoard || boards[0] || null;

  const [label, setLabel] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [startYearMonth, setStartYearMonth] = useState(getCurrentYearMonth());
  const [simulation, setSimulation] = useState<ExpenseSimulationResult | null>(
    null,
  );
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isLoadingBoards && !activeBoard) {
    return <EmptyBoardState />;
  }

  if (!activeBoard) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Cargando tableros…
      </div>
    );
  }

  if (activeBoard.type !== 'everyday') {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8 md:px-6">
        <Button asChild variant="ghost" className="w-fit rounded-xl px-0">
          <Link to="/capture">
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Link>
        </Button>
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          El simulador de gastos está disponible solo en tableros cotidianos.
          Cambiá el tablero activo para probar una compra en cuotas.
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedAmount = parseMoneyInput(totalAmount);
    const parsedInstallments = parseInt(installments, 10);

    if (!label.trim()) {
      toast.error('Ingresá un concepto');
      return;
    }
    if (parsedAmount === null || parsedAmount < 0.01) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (isNaN(parsedInstallments) || parsedInstallments < 1) {
      toast.error('Cantidad de cuotas inválida');
      return;
    }

    setIsSimulating(true);
    try {
      const { simulation: result } = await forecastService.simulateExpense({
        boardId: activeBoard._id,
        label: label.trim(),
        totalAmount: parsedAmount,
        installments: parsedInstallments,
        startYearMonth,
      });
      setSimulation(result);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo simular el gasto',
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Button asChild variant="ghost" className="w-fit rounded-xl px-0">
        <Link to="/capture">
          <ArrowLeft className="mr-2 size-4" />
          Volver a nuevo gasto
        </Link>
      </Button>

      <div className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--signal)_18%,transparent)] text-[var(--signal)]">
          <Calculator className="size-6" />
        </div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Simular gasto
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Probá una compra en cuotas sin registrarla. Tablero:{' '}
          <span className="text-foreground font-medium">
            {activeBoard.name}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sim-label">Concepto</Label>
          <Input
            id="sim-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ej. Zapatillas"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sim-amount">
            Monto total ({activeBoard.baseCurrency})
          </Label>
          <MoneyInput
            id="sim-amount"
            value={totalAmount}
            onChange={setTotalAmount}
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sim-installments">Cuotas</Label>
            <Input
              id="sim-installments"
              type="number"
              min="1"
              max="48"
              value={installments}
              onChange={(event) => setInstallments(event.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sim-start-month">Primer mes</Label>
            <Input
              id="sim-start-month"
              type="month"
              value={startYearMonth}
              onChange={(event) => setStartYearMonth(event.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl"
          disabled={isSimulating}
        >
          {isSimulating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Simulando…
            </>
          ) : (
            'Simular'
          )}
        </Button>
      </form>

      {simulation ? <ExpenseSimulationResults simulation={simulation} /> : null}
    </div>
  );
}
