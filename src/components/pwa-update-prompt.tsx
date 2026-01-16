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
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-background p-4 shadow-lg border">
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
