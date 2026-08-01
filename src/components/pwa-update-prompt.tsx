import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { glassCard } from '@/lib/glass';
import { cn } from '@/lib/utils';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div
      className={cn(
        glassCard,
        'fixed inset-x-3 bottom-[calc(var(--mobile-nav-total)+0.5rem)] z-50 p-4 md:inset-x-auto md:bottom-4 md:right-4 md:max-w-sm',
      )}
    >
      <p className="mb-2 text-sm">Hay una nueva versión disponible</p>
      <div className="flex gap-2">
        <Button onClick={() => updateServiceWorker(true)} size="sm">
          Actualizar
        </Button>
        <Button onClick={close} variant="outline" size="sm">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
