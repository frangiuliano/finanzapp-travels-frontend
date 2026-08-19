import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calculator } from 'lucide-react';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import type { ExpenseSimulatorInitialValues } from '@/components/expense-simulator-form';
import { ExpenseFormDialog } from '@/components/expense-form-dialog';
import { FormDialog } from '@/components/form-dialog';
import { InstallmentSimulatorDialog } from '@/components/installment-simulator-dialog';
import { Button } from '@/components/ui/button';
import { OPEN_MOVEMENT_CREATOR_EVENT } from '@/lib/movement-events';
import { useBoardsStore } from '@/store/boardsStore';

export function CreateMovementSheet() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const board = currentBoard ?? boards[0];
  const [chooserOpen, setChooserOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorSource, setSimulatorSource] = useState<'chooser' | 'expense'>(
    'chooser',
  );
  const [simulatorInitialValues, setSimulatorInitialValues] =
    useState<ExpenseSimulatorInitialValues>();

  useEffect(() => {
    const open = () => setChooserOpen(true);
    window.addEventListener(OPEN_MOVEMENT_CREATOR_EVENT, open);
    return () => window.removeEventListener(OPEN_MOVEMENT_CREATOR_EVENT, open);
  }, []);

  if (!board || board._id.startsWith('mock-')) return null;

  return (
    <>
      <FormDialog
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        title="Nuevo movimiento"
        description={`Se registrará en ${board.name}. Elegí qué querés guardar.`}
        className="sm:max-w-md"
        bodyClassName="pt-5"
      >
        <div className="grid gap-3">
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
                setSimulatorSource('chooser');
                setSimulatorInitialValues(undefined);
                setSimulatorOpen(true);
              }}
            >
              <Calculator className="size-4" /> Simular compra en cuotas
            </Button>
          ) : null}
        </div>
      </FormDialog>
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        board={board}
        onOpenSimulator={(values) => {
          setSimulatorSource('expense');
          setSimulatorInitialValues(values);
          setSimulatorOpen(true);
        }}
      />
      <CreateIncomeSheet
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        boardId={board._id}
        currency={board.baseCurrency}
      />
      <InstallmentSimulatorDialog
        open={simulatorOpen}
        onOpenChange={(open) => {
          setSimulatorOpen(open);
          if (!open && simulatorSource === 'chooser') {
            setChooserOpen(true);
          }
        }}
        board={board}
        initialValues={simulatorInitialValues}
        backLabel={
          simulatorSource === 'expense'
            ? 'Volver a nuevo gasto'
            : 'Volver a nuevo movimiento'
        }
      />
    </>
  );
}
