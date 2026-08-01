import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { BoardForecastSection } from '@/components/board-forecast-section';
import { CreateIncomeSheet } from '@/components/create-income-sheet';
import { MonthlyPlanningCards } from '@/components/monthly-planning-cards';
import { MonthBudgetsProgress } from '@/components/month-budgets-progress';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { boardMonthBudgetsService } from '@/services/boardMonthBudgetsService';
import { forecastService } from '@/services/forecastService';
import { incomesService } from '@/services/incomesService';
import type { Board } from '@/types/board';
import type { BoardMonthBudgetProgress } from '@/types/board-month-budget';
import type { MonthlyForecast } from '@/types/forecast';
import type { Income } from '@/types/income';
import {
  formatCurrency,
  formatDate,
  getCurrentYearMonth,
  isDateInYearMonth,
} from '@/lib/utils';

interface EverydayBoardHomeProps {
  board: Board;
  refreshTrigger: number;
  onRefresh: () => void;
}

export function EverydayBoardHome({
  board,
  refreshTrigger,
  onRefresh,
}: EverydayBoardHomeProps) {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());
  const { categories } = useBoardCategories(board._id);

  const [forecast, setForecast] = useState<MonthlyForecast | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<
    BoardMonthBudgetProgress[]
  >([]);
  const [monthIncomes, setMonthIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);

  useEffect(() => {
    if (board._id.startsWith('mock-')) {
      return;
    }

    let stale = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [forecastResult, progressResult, incomesResult] =
          await Promise.all([
            forecastService
              .getMonthlyForecast(board._id, yearMonth)
              .then(({ forecast: f }) => f)
              .catch(() => null),
            boardMonthBudgetsService
              .getProgress(board._id, yearMonth)
              .then(({ progress }) => progress)
              .catch(() => []),
            incomesService
              .getIncomes(board._id)
              .then(({ incomes }) => incomes)
              .catch(() => []),
          ]);

        if (stale) return;

        setForecast(forecastResult);
        setBudgetProgress(progressResult);
        setMonthIncomes(
          incomesResult
            .filter((income) => isDateInYearMonth(income.incomeDate, yearMonth))
            .sort(
              (a, b) =>
                new Date(b.incomeDate).getTime() -
                new Date(a.incomeDate).getTime(),
            ),
        );
      } finally {
        if (!stale) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      stale = true;
    };
  }, [board._id, yearMonth, refreshTrigger]);

  const currency = forecast?.currency ?? board.baseCurrency;

  const emptyMonthState = useMemo(() => {
    if (isLoading || !forecast) return false;
    return (
      forecast.actual.totalIncomes === 0 &&
      forecast.actual.totalExpenses === 0 &&
      forecast.planned.totalIncomes === 0 &&
      forecast.planned.totalOutflows === 0 &&
      budgetProgress.length === 0
    );
  }, [isLoading, forecast, budgetProgress.length]);

  const handleIncomeCreated = () => {
    onRefresh();
  };

  if (board._id.startsWith('mock-')) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
        Estás viendo mocks locales. Cambiá el tablero activo desde el selector
        para validar el home mensual.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <YearMonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl"
            onClick={() => setIsIncomeSheetOpen(true)}
          >
            <PlusIcon className="size-4" />
            Registrar ingreso
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/boards/settings">Config. tablero</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : forecast ? (
        <MonthlyPlanningCards forecast={forecast} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No se pudo cargar el resumen del mes. Reintentá en unos segundos.
          </CardContent>
        </Card>
      )}

      {emptyMonthState && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Empezá el mes</CardTitle>
            <CardDescription>
              Registrá ingresos puntuales o configurá recurrentes, gastos fijos
              y cuotas para ver la proyección del mes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => setIsIncomeSheetOpen(true)}
            >
              Registrar ingreso
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/boards/settings">Config. tablero</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/capture">Nuevo gasto</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && forecast ? (
        <BoardForecastSection
          incomes={forecast.planned.incomes}
          fixedExpenses={forecast.planned.fixedExpenses}
          installments={forecast.planned.installments}
          currency={currency}
          isFutureMonth={forecast.isFutureMonth}
        />
      ) : null}

      {!isLoading && (
        <MonthBudgetsProgress
          progress={budgetProgress}
          categories={categories}
          yearMonth={yearMonth}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingresos puntuales del mes</CardTitle>
          <CardDescription>
            Movimientos registrados manualmente en {yearMonth}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : monthIncomes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin ingresos puntuales este mes. Los recurrentes aparecen en la
              planificación de arriba.
            </p>
          ) : (
            <ul className="divide-y">
              {monthIncomes.map((income) => (
                <li
                  key={income._id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{income.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(income.incomeDate)}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums shrink-0 text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(income.amount, income.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div>
        <RecentExpensesTable
          tripId={board._id}
          refreshTrigger={refreshTrigger}
          onRefresh={onRefresh}
        />
      </div>

      <CreateIncomeSheet
        open={isIncomeSheetOpen}
        onOpenChange={setIsIncomeSheetOpen}
        boardId={board._id}
        currency={currency}
        onSuccess={handleIncomeCreated}
      />
    </div>
  );
}
