import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowLeft, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { billingPeriodsService } from '@/services/billingPeriodsService';
import type {
  BillingPeriod,
  BillingPeriodDefaults,
} from '@/types/billing-period';
import { formatDate } from '@/lib/utils';

export default function BillingPeriodConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentMethodId = searchParams.get('paymentMethodId') ?? '';
  const requestedCycle = searchParams.get('cycleLabel') ?? '';
  const mode =
    searchParams.get('mode') ?? (requestedCycle ? 'legacy' : 'manage');
  const [pending, setPending] = useState<BillingPeriodDefaults | null>(null);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [editingCycle, setEditingCycle] = useState<string | null>(null);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!paymentMethodId) return;
    setIsLoading(true);
    try {
      const [nextResult, historyResult] = await Promise.all([
        mode === 'legacy' && requestedCycle
          ? billingPeriodsService.getPending(paymentMethodId, requestedCycle)
          : billingPeriodsService.getNext(paymentMethodId),
        billingPeriodsService.listByPaymentMethod(paymentMethodId),
      ]);
      setPending(nextResult.pending);
      setPeriods(historyResult.periods);
      setPeriodFrom(nextResult.pending.periodFrom);
      setPeriodTo(nextResult.pending.periodTo);
      setEditingCycle(
        mode === 'legacy' && requestedCycle ? requestedCycle : null,
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudieron cargar los ciclos',
      );
    } finally {
      setIsLoading(false);
    }
  }, [mode, paymentMethodId, requestedCycle]);

  useEffect(() => {
    void load();
  }, [load]);

  const editPeriod = (period: BillingPeriod) => {
    setEditingCycle(period.cycleLabel);
    setPeriodFrom(period.periodFrom);
    setPeriodTo(period.periodTo);
  };

  const resetToNext = () => {
    if (!pending) return;
    setEditingCycle(null);
    setPeriodFrom(pending.periodFrom);
    setPeriodTo(pending.periodTo);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentMethodId || !periodTo) return;
    setIsSaving(true);
    try {
      await billingPeriodsService.confirm({
        paymentMethodId,
        cycleLabel: editingCycle ?? periodTo.slice(0, 7),
        periodFrom,
        periodTo,
      });
      toast.success(
        editingCycle ? 'Ciclo actualizado' : 'Próximo cierre guardado',
      );
      await load();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo guardar el ciclo',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!paymentMethodId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Falta seleccionar una tarjeta.
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to="/boards/settings?tab=payment-methods">
            Volver a medios de pago
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" /> Volver
      </Button>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Ciclos de tarjeta
          </CardTitle>
          <CardDescription>
            Informá el próximo cierre o corregí ciclos anteriores. El día de
            cierre de la tarjeta se usa solo como estimación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Cargando ciclos…
            </div>
          ) : pending ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium">{pending.paymentMethodName}</p>
                <p className="mt-1 text-muted-foreground">
                  {editingCycle
                    ? 'Editando un ciclo histórico'
                    : 'Próximo período'}{' '}
                  · cierre habitual día {pending.closingDay}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="period-from">Desde</Label>
                  <Input
                    id="period-from"
                    type="date"
                    value={periodFrom}
                    onChange={(event) => setPeriodFrom(event.target.value)}
                    required
                    disabled={isSaving || !editingCycle}
                    className="rounded-xl"
                  />
                  {!editingCycle ? (
                    <p className="text-xs text-muted-foreground">
                      Comienza al día siguiente del último cierre.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period-to">Hasta (inclusive)</Label>
                  <Input
                    id="period-to"
                    type="date"
                    value={periodTo}
                    onChange={(event) => setPeriodTo(event.target.value)}
                    required
                    disabled={isSaving}
                    className="rounded-xl"
                  />
                </div>
              </div>
              {periodFrom && periodTo ? (
                <p className="text-sm text-muted-foreground">
                  Ciclo: {formatDate(periodFrom)} – {formatDate(periodTo)},
                  inclusive
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 rounded-xl"
                  disabled={isSaving}
                >
                  {isSaving
                    ? 'Guardando…'
                    : editingCycle
                      ? 'Guardar corrección'
                      : 'Guardar próximo cierre'}
                </Button>
                {editingCycle ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={resetToNext}
                  >
                    Cancelar edición
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Historial de ciclos
          </CardTitle>
          <CardDescription>
            Podés corregir las fechas si un cierre se cargó mal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ciclos guardados.
            </p>
          ) : (
            <ul className="space-y-2">
              {periods.map((period) => (
                <li
                  key={period._id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(period.periodFrom)} –{' '}
                      {formatDate(period.periodTo)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cierre {formatDate(period.periodTo)} · hasta inclusive
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ciclo con cierre ${period.periodTo}`}
                    onClick={() => editPeriod(period)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
