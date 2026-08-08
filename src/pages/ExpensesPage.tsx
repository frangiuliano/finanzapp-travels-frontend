import { Link, useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { ExpensesExplorerSection } from '@/components/expenses-explorer-section';
import { Button } from '@/components/ui/button';
import type { HomeMonthView } from '@/lib/expense-month-attribution';
import { getCurrentYearMonth } from '@/lib/utils';
import { useBoardsStore } from '@/store/boardsStore';

export default function ExpensesPage() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const activeBoard = currentBoard || boards[0];
  const [searchParams] = useSearchParams();

  const initialYearMonth =
    searchParams.get('yearMonth') ?? getCurrentYearMonth();
  const initialMonthViewParam = searchParams.get('view');
  const initialMonthView: HomeMonthView | undefined =
    initialMonthViewParam === 'calendar' ||
    initialMonthViewParam === 'cash_impact'
      ? initialMonthViewParam
      : undefined;
  const initialPaymentMethodId =
    searchParams.get('paymentMethodId') ?? undefined;

  if (!activeBoard) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Receipt className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">Gastos</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creá tu primer tablero para explorar gastos con filtros por mes, medio
          de pago y categoría.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/onboarding">Crear tablero</Link>
        </Button>
      </div>
    );
  }

  if (activeBoard._id.startsWith('mock-')) {
    return (
      <div className="w-full flex-1 px-4 py-6 lg:px-6">
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
          Estás viendo mocks locales. Cambiá el tablero activo desde el selector
          para explorar gastos con la API.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-4 py-6 lg:px-6">
      <ExpensesExplorerSection
        board={activeBoard}
        initialYearMonth={initialYearMonth}
        initialMonthView={initialMonthView}
        initialPaymentMethodId={initialPaymentMethodId}
      />
    </div>
  );
}
