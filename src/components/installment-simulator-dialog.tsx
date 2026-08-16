import { ExpenseSimulatorForm } from '@/components/expense-simulator-form';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import type { Board } from '@/types/board';

interface InstallmentSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  onBackToExpense: () => void;
}

export function InstallmentSimulatorDialog({
  open,
  onOpenChange,
  board,
  onBackToExpense,
}: InstallmentSimulatorDialogProps) {
  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      mobilePresentation="dialog"
      title="Simular gasto"
      description={`Probá una compra en cuotas sin registrarla. Tablero: ${board.name}.`}
    >
      <ExpenseSimulatorForm board={board} onBack={onBackToExpense} />
    </ResponsiveFormSheet>
  );
}
