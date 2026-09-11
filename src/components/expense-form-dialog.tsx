import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { QuickExpenseForm } from '@/components/quick-expense-form';
import type { Board } from '@/types/board';
import type { Budget } from '@/types/budget';
import type { Expense } from '@/types/expense';
import type { Participant } from '@/types/participant';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  budgets?: Budget[];
  participants?: Participant[];
  expense?: Expense | null;
  onSuccess?: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  board,
  budgets,
  participants,
  expense,
  onSuccess,
}: ExpenseFormDialogProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? 'Editar gasto' : 'Nuevo gasto'}
      description={`${board.name} · ${board.baseCurrency}`}
    >
      <QuickExpenseForm
        key={expense?._id ?? 'new-expense'}
        board={board}
        expense={expense}
        prefilledBudgets={budgets}
        prefilledParticipants={participants}
        isDialog
        onSuccess={handleSuccess}
      />
    </ResponsiveFormDialog>
  );
}
