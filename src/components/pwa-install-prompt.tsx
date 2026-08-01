import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { glassCard } from '@/lib/glass';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { dismiss, install, showIosHint, showPrompt } = usePwaInstall();

  if (!showPrompt) return null;

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(var(--mobile-nav-total)+0.5rem)] z-50 mx-auto max-w-lg px-3 md:bottom-4 md:right-4 md:left-auto md:max-w-sm md:px-0"
      role="region"
      aria-label="Instalar aplicación"
    >
      <div className={cn(glassCard, 'p-4')}>
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
                Compartir y elegí <strong>Agregar a inicio</strong> para abrir
                la app como en Android.
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
          <Button className="mt-3 w-full" onClick={() => void install()}>
            <Download className="size-4" />
            Instalar
          </Button>
        )}
      </div>
    </div>
  );
}
