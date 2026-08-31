import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function PWAInstallPrompt() {
  const { dismiss, install, showIosHint, showPrompt } = usePwaInstall();

  if (!showPrompt) return null;

  return (
    <div
      aria-live="polite"
      className="mx-4 mt-4 shrink-0 rounded-xl border border-primary/20 bg-card text-card-foreground lg:mx-6"
      role="region"
      aria-label="Instalar aplicación"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-sm font-semibold">
              {showIosHint ? 'Agregá FinanzApp al inicio' : 'Instalá FinanzApp'}
            </p>
            {showIosHint ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                En Safari, tocá{' '}
                <Share
                  aria-hidden
                  className="inline size-3.5 align-text-bottom"
                />{' '}
                Compartir y elegí <strong>Agregar a inicio</strong> para acceder
                a la app desde tu pantalla de inicio.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Accedé más rápido y usá la captura de gastos con un toque desde
                la barra inferior.
              </p>
            )}
          </div>
          <Button
            aria-label="Cerrar sugerencia de instalación"
            className="size-8 shrink-0"
            onClick={dismiss}
            size="icon"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>

        {!showIosHint && (
          <Button
            className="mt-3 min-h-11 w-full sm:w-auto"
            onClick={() => void install()}
          >
            <Download className="size-4" />
            Instalar
          </Button>
        )}
      </div>
    </div>
  );
}
