import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyBoardState } from '@/components/empty-board-state';
import { QuickExpenseForm } from '@/components/quick-expense-form';
import { PlusCircle } from 'lucide-react';
import { useBoardsStore } from '@/store/boardsStore';

export default function CapturePage() {
  const navigate = useNavigate();
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const isLoadingBoards = useBoardsStore((state) => state.isLoading);
  const activeBoard = currentBoard || boards[0] || null;

  const handleSuccess = () => {
    navigate('/home');
  };

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

  if (activeBoard._id.startsWith('mock-')) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
          Estás viendo mocks locales. Cambiá el tablero activo desde el selector
          para registrar gastos reales.
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/home">Volver al home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--signal)_18%,transparent)] text-[var(--signal)]">
          <PlusCircle className="size-6" />
        </div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Nuevo gasto
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Tablero activo:{' '}
          <span className="text-foreground font-medium">
            {activeBoard.name}
          </span>
        </p>
      </div>

      <QuickExpenseForm board={activeBoard} onSuccess={handleSuccess} />
    </div>
  );
}
