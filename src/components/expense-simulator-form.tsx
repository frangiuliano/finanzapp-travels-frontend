import { useState } from 'react';
import { AxiosError } from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { ExpenseSimulationResults } from '@/components/expense-simulation-results';
import { parseMoneyInput } from '@/lib/money';
import { getCurrentYearMonth } from '@/lib/utils';
import { forecastService } from '@/services/forecastService';
import type { Board } from '@/types/board';
import type { ExpenseSimulationResult } from '@/types/expense-simulation';

interface ExpenseSimulatorFormProps {
  board: Board;
  onBack?: () => void;
}

export function ExpenseSimulatorForm({
  board,
  onBack,
}: ExpenseSimulatorFormProps) {
  const [label, setLabel] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [startYearMonth, setStartYearMonth] = useState(getCurrentYearMonth());
  const [simulation, setSimulation] = useState<ExpenseSimulationResult | null>(
    null,
  );
  const [isSimulating, setIsSimulating] = useState(false);

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
        boardId: board._id,
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
    <div className="space-y-6">
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          className="w-fit rounded-xl px-0"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 size-4" />
          Volver a nuevo gasto
        </Button>
      ) : null}

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
          <Label htmlFor="sim-amount">Monto total ({board.baseCurrency})</Label>
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
