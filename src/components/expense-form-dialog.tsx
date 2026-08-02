import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{expense ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
          <DialogDescription>
            {board.name} · {board.baseCurrency}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <QuickExpenseForm
            key={expense?._id ?? 'new-expense'}
            board={board}
            expense={expense}
            prefilledBudgets={budgets}
            prefilledParticipants={participants}
            isDialog
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
