import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
import type { BillingPeriodDefaults } from '@/types/billing-period';
import { formatDate } from '@/lib/utils';

export default function BillingPeriodConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentMethodId = searchParams.get('paymentMethodId') ?? '';
  const cycleLabel = searchParams.get('cycleLabel') ?? '';

  const [pending, setPending] = useState<BillingPeriodDefaults | null>(null);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!paymentMethodId || !cycleLabel) {
      setIsLoading(false);
      return;
    }

    let stale = false;

    void (async () => {
      setIsLoading(true);
      try {
        const { pending: data } = await billingPeriodsService.getPending(
          paymentMethodId,
          cycleLabel,
        );
        if (stale) return;
        setPending(data);
        setPeriodFrom(data.periodFrom);
        setPeriodTo(data.periodTo);
      } catch (error) {
        if (!stale) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'No se pudo cargar el período',
          );
        }
      } finally {
        if (!stale) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      stale = true;
    };
  }, [paymentMethodId, cycleLabel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentMethodId || !cycleLabel) return;

    setIsSaving(true);
    try {
      await billingPeriodsService.confirm({
        paymentMethodId,
        cycleLabel,
        periodFrom,
        periodTo,
      });
      toast.success('Período de facturación confirmado');
      navigate('/boards/settings?tab=payment-methods');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'No se pudo confirmar el período',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!paymentMethodId || !cycleLabel) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Faltan parámetros para confirmar el período.
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to="/home">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Button>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Confirmar período de facturación
          </CardTitle>
          <CardDescription>
            Ajustá las fechas reales del resumen si el banco movió el cierre.
            Esto mejora los reportes históricos y la proyección.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Cargando período…</span>
            </div>
          ) : pending ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium">{pending.paymentMethodName}</p>
                <p className="mt-1 text-muted-foreground">
                  Ciclo {pending.cycleLabel} · Cierre estimado día{' '}
                  {pending.closingDay}
                </p>
                {pending.isConfirmed ? (
                  <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                    Este período ya estaba confirmado. Podés actualizar las
                    fechas.
                  </p>
                ) : null}
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
                    disabled={isSaving}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period-to">Hasta (cierre)</Label>
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
                <p className="text-xs text-muted-foreground">
                  Período: {formatDate(periodFrom)} – {formatDate(periodTo)}
                </p>
              ) : null}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 rounded-xl"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando…' : 'Confirmar período'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate('/home')}
                  disabled={isSaving}
                >
                  Después
                </Button>
              </div>
            </form>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No se encontró el período solicitado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
