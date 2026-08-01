import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Settings2 } from 'lucide-react';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { useBoardsStore } from '@/store/boardsStore';
import {
  PAYMENT_METHOD_KIND_LABELS,
  PaymentMethod,
} from '@/types/payment-method';

function formatPaymentMethodLabel(method: PaymentMethod): string {
  const parts = [method.name, PAYMENT_METHOD_KIND_LABELS[method.kind]];
  if (method.lastFourDigits) {
    parts.push(`•••• ${method.lastFourDigits}`);
  }
  return parts.join(' · ');
}

export default function CapturePage() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const activeBoard = currentBoard || boards[0] || null;
  const { paymentMethods, isLoading } = useAvailablePaymentMethods(
    activeBoard?._id,
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--signal)_18%,transparent)] text-[var(--signal)]">
          <PlusCircle className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">Captura rápida</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          El formulario completo de gastos llega en un issue siguiente. Acá
          podés ver los medios de pago disponibles para el tablero activo.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Medios disponibles</CardTitle>
          <CardDescription>
            {activeBoard
              ? `Listos para usar en captura en "${activeBoard.name}".`
              : 'Seleccioná o creá un tablero para ver medios de pago.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!activeBoard ? (
            <p className="text-sm text-muted-foreground">
              Sin tablero activo.{' '}
              <Link
                to="/onboarding"
                className="text-primary underline-offset-4 hover:underline"
              >
                Crear tablero
              </Link>
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando medios…</p>
          ) : paymentMethods.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No hay medios de pago configurados para este tablero.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Link to="/boards/settings">
                  <Settings2 className="mr-1.5 size-4" />
                  Configurar medios
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {paymentMethods.map((method) => (
                <li
                  key={method._id}
                  className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm"
                >
                  <span>{formatPaymentMethodLabel(method)}</span>
                  {method.kind === 'credit' && !method.closingDay ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      Sin cierre
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/home">Volver al home</Link>
        </Button>
      </div>
    </div>
  );
}
