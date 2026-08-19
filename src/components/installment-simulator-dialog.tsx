import { ArrowLeft } from 'lucide-react';
import { ExpenseSimulatorForm } from '@/components/expense-simulator-form';
import type { ExpenseSimulatorInitialValues } from '@/components/expense-simulator-form';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { Button } from '@/components/ui/button';
import type { Board } from '@/types/board';

interface InstallmentSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  initialValues?: ExpenseSimulatorInitialValues;
  backLabel?: string;
}

export function InstallmentSimulatorDialog({
  open,
  onOpenChange,
  board,
  initialValues,
  backLabel = 'Volver a nuevo gasto',
}: InstallmentSimulatorDialogProps) {
  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Simular gasto"
      description={`Probá una compra en cuotas sin registrarla · ${board.name}`}
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto rounded-xl px-0 text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Button>
        <ExpenseSimulatorForm board={board} initialValues={initialValues} />
      </div>
    </ResponsiveFormDialog>
  );
}
