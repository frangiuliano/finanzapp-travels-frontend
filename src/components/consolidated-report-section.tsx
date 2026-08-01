import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsService } from '@/services/reportsService';
import type { ConsolidatedReport } from '@/types/report';
import { formatCurrency } from '@/lib/utils';

interface ConsolidatedReportSectionProps {
  yearMonth: string;
}

export function ConsolidatedReportSection({
  yearMonth,
}: ConsolidatedReportSectionProps) {
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { report: consolidated } =
          await reportsService.getConsolidatedReport(yearMonth);
        if (!stale) {
          setReport(consolidated);
        }
      } catch {
        if (!stale) {
          setLoadError('No se pudo cargar el consolidado.');
          setReport(null);
        }
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
  }, [yearMonth]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {loadError}
        </CardContent>
      </Card>
    );
  }

  if (!report || report.boards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consolidado multi-tablero</CardTitle>
          <CardDescription>
            Suma de todos tus tableros para el mes seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin movimientos en ningún tablero este mes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currencyTotals = Object.entries(report.totalsByCurrency);

  return (
    <div className="space-y-4">
      {currencyTotals.map(([currency, totals]) => (
        <Card key={currency}>
          <CardHeader>
            <CardTitle className="text-lg">Totales en {currency}</CardTitle>
            <CardDescription>
              {totals.boardCount} tablero
              {totals.boardCount === 1 ? '' : 's'} en {currency}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(totals.totalIncomes, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {formatCurrency(totals.totalExpenses, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p
                className={`font-semibold tabular-nums ${
                  totals.remaining < 0 ? 'text-destructive' : ''
                }`}
              >
                {formatCurrency(totals.remaining, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Por tablero</CardTitle>
          <CardDescription>Desglose del mes en cada tablero.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {report.boards.map((board) => (
              <li
                key={board.boardId}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{board.boardName}</p>
                  <p className="text-xs text-muted-foreground">
                    Moneda {board.currency}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(board.totalIncomes, board.currency)}
                  </span>
                  <span className="text-rose-700 dark:text-rose-400">
                    −{formatCurrency(board.totalExpenses, board.currency)}
                  </span>
                  <span
                    className={
                      board.remaining < 0 ? 'text-destructive font-medium' : ''
                    }
                  >
                    = {formatCurrency(board.remaining, board.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
