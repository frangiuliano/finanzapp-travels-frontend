import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { ExpenseSimulatorForm } from '@/components/expense-simulator-form';
import { Button } from '@/components/ui/button';
import { EmptyBoardState } from '@/components/empty-board-state';
import { useBoardsStore } from '@/store/boardsStore';

export default function SimulateExpensePage() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const isLoadingBoards = useBoardsStore((state) => state.isLoading);
  const activeBoard = currentBoard || boards[0] || null;

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

      <ExpenseSimulatorForm board={activeBoard} />
    </div>
  );
}
