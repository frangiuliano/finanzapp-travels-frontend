import { CloudOff } from 'lucide-react';

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
      className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-950 dark:text-amber-100"
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
