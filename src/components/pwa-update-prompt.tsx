import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-lg border bg-background p-4 shadow-lg md:inset-x-auto md:bottom-4 md:right-4 md:max-w-sm">
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
