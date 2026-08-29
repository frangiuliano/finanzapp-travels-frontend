import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CachedSessionBanner() {
  return (
    <div
      role="status"
      className={cn(
        'glass-surface mx-3 mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm',
        'border-sky-500/25 bg-sky-500/12 text-sky-950 dark:text-sky-100',
        'md:mx-0 md:mt-0 md:rounded-none md:border-x-0 md:border-t-0',
      )}
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>
        Sin conexión. Estás viendo tu última sesión conocida — algunas acciones
        se sincronizarán al volver la señal.
      </span>
    </div>
  );
}
