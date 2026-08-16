import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QuickExpenseForm } from '@/components/quick-expense-form';
import { useKeepFocusedInputVisible } from '@/hooks/use-keep-focused-input-visible';
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
  onOpenSimulator?: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  board,
  budgets,
  participants,
  expense,
  onSuccess,
  onOpenSimulator,
}: ExpenseFormDialogProps) {
  const formBodyRef = useRef<HTMLDivElement>(null);
  useKeepFocusedInputVisible(formBodyRef, open);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-dialog gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{expense ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
          <DialogDescription>
            {board.name} · {board.baseCurrency}
          </DialogDescription>
        </DialogHeader>
        <div
          ref={formBodyRef}
          className="form-dialog-scroll-body min-h-0 shrink overflow-y-auto overscroll-contain px-6 py-4"
        >
          <QuickExpenseForm
            key={expense?._id ?? 'new-expense'}
            board={board}
            expense={expense}
            prefilledBudgets={budgets}
            prefilledParticipants={participants}
            isDialog
            onSuccess={handleSuccess}
            onOpenSimulator={onOpenSimulator}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
