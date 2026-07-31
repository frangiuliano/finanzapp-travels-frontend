import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadBoards } from '@/lib/load-boards';
import { useBoardsStore } from '@/store/boardsStore';
import { useState } from 'react';

export function BoardsBootstrapError() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await loadBoards();
    } finally {
      setIsRetrying(false);
    }
  };

  const bootstrapStatus = useBoardsStore((state) => state.bootstrapStatus);
  if (bootstrapStatus !== 'error') return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="font-display text-xl font-bold">
          No pudimos cargar tus tableros
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Puede ser un problema temporal de conexión. Reintentá en unos
          segundos.
        </p>
      </div>
      <Button
        className="rounded-xl"
        onClick={() => void handleRetry()}
        disabled={isRetrying}
      >
        <RefreshCw
          className={`mr-2 size-4 ${isRetrying ? 'animate-spin' : ''}`}
        />
        {isRetrying ? 'Reintentando…' : 'Reintentar'}
      </Button>
    </div>
  );
}
