import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { BoardMonthSummaryCards } from '@/components/board-month-summary-cards';
import { ConsolidatedReportSection } from '@/components/consolidated-report-section';
import { CreditCycleReportSection } from '@/components/credit-cycle-report-section';
import { ReportsBreakdownChart } from '@/components/reports-breakdown-chart';
import { YearMonthSelector } from '@/components/year-month-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportsService } from '@/services/reportsService';
import { useBoardsStore } from '@/store/boardsStore';
import type { BoardCalendarReport } from '@/types/report';
import { PAYMENT_METHOD_KIND_LABELS } from '@/types/payment-method';
import { getCurrentYearMonth } from '@/lib/utils';

type ReportsView = 'calendar' | 'consolidated';

export default function ReportsPage() {
  const boards = useBoardsStore((state) => state.boards);
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const activeBoard = currentBoard || boards[0];

  const [searchParams, setSearchParams] = useSearchParams();
  const initialView: ReportsView =
    searchParams.get('view') === 'consolidated' ? 'consolidated' : 'calendar';
  const [activeView, setActiveView] = useState<ReportsView>(initialView);
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);

  const [calendarReport, setCalendarReport] =
    useState<BoardCalendarReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleViewChange = (value: string) => {
    const view = value as ReportsView;
    setActiveView(view);
    if (view === 'consolidated') {
      setSearchParams({ view: 'consolidated' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (!activeBoard || activeBoard._id.startsWith('mock-')) {
      setCalendarReport(null);
      return;
    }

    if (activeView !== 'calendar') {
      return;
    }

    let stale = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { report } = await reportsService.getBoardCalendarReport(
          activeBoard._id,
          yearMonth,
        );
        if (!stale) {
          setCalendarReport(report);
        }
      } catch {
        if (!stale) {
          setLoadError('No se pudo cargar el reporte del mes.');
          setCalendarReport(null);
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
  }, [activeBoard, yearMonth, activeView]);

  const categoryItems = useMemo(
    () =>
      (calendarReport?.byCategory ?? []).map((item) => ({
        id: item.categoryId ?? 'uncategorized',
        label: item.categoryName,
        total: item.total,
        count: item.count,
      })),
    [calendarReport?.byCategory],
  );

  const paymentMethodItems = useMemo(
    () =>
      (calendarReport?.byPaymentMethod ?? []).map((item) => ({
        id: item.paymentMethodId ?? 'unknown',
        label: item.kind
          ? `${item.paymentMethodName} (${PAYMENT_METHOD_KIND_LABELS[item.kind]})`
          : item.paymentMethodName,
        total: item.total,
        count: item.count,
      })),
    [calendarReport?.byPaymentMethod],
  );

  if (!activeBoard) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">Reportes</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creá tu primer tablero para ver reportes mensuales, categorías y
          ciclos de tarjeta.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/onboarding">Crear tablero</Link>
        </Button>
      </div>
    );
  }

  if (activeBoard._id.startsWith('mock-')) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
          Estás viendo mocks locales. Cambiá el tablero activo desde el selector
          para validar reportes con la API.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Reportes
        </h1>
        <p className="text-sm text-muted-foreground">
          Tablero activo:{' '}
          <span className="font-medium">{activeBoard.name}</span>
        </p>
      </div>

      <YearMonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <Tabs value={activeView} onValueChange={handleViewChange}>
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="calendar" className="rounded-lg">
            Mes calendario
          </TabsTrigger>
          <TabsTrigger value="consolidated" className="rounded-lg">
            Consolidado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : loadError ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {loadError}
              </CardContent>
            </Card>
          ) : calendarReport ? (
            <>
              <BoardMonthSummaryCards
                summary={calendarReport}
                yearMonth={yearMonth}
              />

              {calendarReport.totalIncomes === 0 &&
                calendarReport.totalExpenses === 0 && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Sin movimientos
                      </CardTitle>
                      <CardDescription>
                        No hay ingresos ni gastos en este mes calendario.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild size="sm" className="rounded-xl">
                        <Link to="/capture">Capturar gasto</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

              <ReportsBreakdownChart
                title="Por categoría"
                description="Gastos del mes calendario agrupados por categoría."
                items={categoryItems}
                currency={calendarReport.currency}
                emptyMessage="Sin gastos categorizados este mes."
              />

              <ReportsBreakdownChart
                title="Por medio de pago"
                description="Gastos del mes calendario por tarjeta, débito o efectivo."
                items={paymentMethodItems}
                currency={calendarReport.currency}
                emptyMessage="Sin gastos con medio de pago este mes."
              />

              <CreditCycleReportSection boardId={activeBoard._id} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="consolidated" className="mt-6">
          <ConsolidatedReportSection yearMonth={yearMonth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
