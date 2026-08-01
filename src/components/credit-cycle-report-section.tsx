import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { reportsService } from '@/services/reportsService';
import type { CreditCycleReportResponse } from '@/types/report';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CreditCycleReportSectionProps {
  boardId: string;
}

function formatCycleLabel(cycleLabel: string): string {
  const [year, month] = cycleLabel.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export function CreditCycleReportSection({
  boardId,
}: CreditCycleReportSectionProps) {
  const { paymentMethods, isLoading: isLoadingMethods } =
    useAvailablePaymentMethods(boardId);

  const creditMethods = useMemo(
    () => paymentMethods.filter((method) => method.kind === 'credit'),
    [paymentMethods],
  );

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState('current');
  const [report, setReport] = useState<CreditCycleReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (creditMethods.length === 0) {
      setSelectedMethodId('');
      return;
    }

    setSelectedMethodId((current) => {
      if (current && creditMethods.some((method) => method._id === current)) {
        return current;
      }
      return creditMethods[0]._id;
    });
  }, [creditMethods]);

  useEffect(() => {
    if (!selectedMethodId || boardId.startsWith('mock-')) {
      setReport(null);
      return;
    }

    let stale = false;

    const load = async () => {
      setIsLoadingReport(true);
      setLoadError(null);
      try {
        const { report: cycleReport } =
          await reportsService.getCreditCycleReport(
            boardId,
            selectedMethodId,
            selectedCycle,
          );
        if (!stale) {
          setReport(cycleReport);
        }
      } catch {
        if (!stale) {
          setLoadError('No se pudo cargar el ciclo de la tarjeta.');
          setReport(null);
        }
      } finally {
        if (!stale) {
          setIsLoadingReport(false);
        }
      }
    };

    void load();

    return () => {
      stale = true;
    };
  }, [boardId, selectedMethodId, selectedCycle]);

  useEffect(() => {
    if (report?.status === 'ok') {
      setSelectedCycle((current) => {
        if (current === 'current' || report.availableCycles.includes(current)) {
          return current;
        }
        return 'current';
      });
    }
  }, [report]);

  if (isLoadingMethods) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (creditMethods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ciclo de tarjeta de crédito</CardTitle>
          <CardDescription>
            Agregá una tarjeta de crédito para ver gastos por ciclo de cierre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/boards/settings">Configurar medios de pago</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ciclo de tarjeta de crédito</CardTitle>
        <CardDescription>
          Los ciclos pueden diferir del mes calendario según el día de cierre.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Tarjeta</p>
            <Select
              value={selectedMethodId}
              onValueChange={setSelectedMethodId}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Elegí una tarjeta" />
              </SelectTrigger>
              <SelectContent>
                {creditMethods.map((method) => (
                  <SelectItem key={method._id} value={method._id}>
                    {method.name}
                    {method.lastFourDigits
                      ? ` ·••• ${method.lastFourDigits}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {report?.status === 'ok' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ciclo</p>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Ciclo actual</SelectItem>
                  {report.availableCycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {formatCycleLabel(cycle)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoadingReport ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : report?.status === 'closing_day_required' ? (
          <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-2">
              <p className="text-sm">{report.message}</p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                <Link to="/boards/settings">
                  Configurar día de cierre para {report.paymentMethodName}
                </Link>
              </Button>
            </div>
          </div>
        ) : report?.status === 'ok' ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Cierre día {report.closingDay} · {formatDate(report.periodFrom)} –{' '}
              {formatDate(report.periodToInclusive)}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {formatCurrency(report.totalExpenses, report.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.expenseCount} gasto
              {report.expenseCount === 1 ? '' : 's'} en este ciclo
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
