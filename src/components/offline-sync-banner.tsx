import { CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineSyncBannerProps {
  pendingCount: number;
}

export function OfflineSyncBanner({ pendingCount }: OfflineSyncBannerProps) {
  if (pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        'glass-surface mx-3 mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm',
        'border-amber-500/25 bg-amber-500/12 text-amber-950 dark:text-amber-100',
        'md:mx-0 md:mt-0 md:rounded-none md:border-x-0 md:border-t-0',
      )}
    >
      <CloudOff className="size-4 shrink-0" aria-hidden />
      <span>
        {pendingCount === 1
          ? '1 gasto pendiente de sincronizar'
          : `${pendingCount} gastos pendientes de sincronizar`}
        . Se enviarán al volver la conexión.
      </span>
    </div>
  );
}
