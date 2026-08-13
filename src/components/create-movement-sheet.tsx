import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calculator, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OPEN_MOVEMENT_CREATOR_EVENT } from '@/lib/movement-events';
import { useBoardsStore } from '@/store/boardsStore';

export function CreateMovementSheet() {
  const navigate = useNavigate();
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const board = currentBoard ?? boards[0];
  const [chooserOpen, setChooserOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

  useEffect(() => {
    const open = () => setChooserOpen(true);
    window.addEventListener(OPEN_MOVEMENT_CREATOR_EVENT, open);
    return () => window.removeEventListener(OPEN_MOVEMENT_CREATOR_EVENT, open);
  }, []);

  if (!board || board._id.startsWith('mock-')) return null;

  return (
    <>
      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-3xl p-5 sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </div>
            <DialogTitle>Nuevo movimiento</DialogTitle>
            <DialogDescription>
              Se registrará en {board.name}. Elegí qué querés guardar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <Button
              variant="outline"
              className="h-auto justify-start rounded-2xl p-4 text-left"
              onClick={() => {
                setChooserOpen(false);
                setExpenseOpen(true);
              }}
            >
              <ArrowUpRight className="size-5 text-primary" />
              <span>
                <strong className="block">Gasto</strong>
                <span className="text-xs font-normal text-muted-foreground">
                  Una compra, pago o gasto.
                </span>
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto justify-start rounded-2xl p-4 text-left"
              onClick={() => {
                setChooserOpen(false);
                setIncomeOpen(true);
              }}
            >
              <ArrowDownLeft className="size-5 text-emerald-600" />
              <span>
                <strong className="block">Ingreso</strong>
                <span className="text-xs font-normal text-muted-foreground">
                  Sueldo, devolución u otro ingreso.
                </span>
              </span>
            </Button>
            {board.type === 'everyday' ? (
              <Button
                variant="ghost"
                className="justify-start rounded-xl text-muted-foreground"
                onClick={() => {
                  setChooserOpen(false);
                  navigate('/simulate');
                }}
              >
                <Calculator className="size-4" /> Simular compra en cuotas
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        board={board}
      />
      <CreateIncomeSheet
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        boardId={board._id}
        currency={board.baseCurrency}
      />
    </>
  );
}
