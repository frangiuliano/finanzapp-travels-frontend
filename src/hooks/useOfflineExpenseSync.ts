import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { processOfflineExpenseQueue } from '@/services/createExpenseWithOffline';
import {
  offlineExpenseQueue,
  subscribeOfflineQueue,
} from '@/services/offlineExpenseQueue';

export function useOfflineExpenseSync(): number {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeOfflineQueue(setPendingCount);

    const sync = async () => {
      const synced = await processOfflineExpenseQueue();
      if (synced > 0) {
        toast.success(
          synced === 1
            ? '1 gasto sincronizado'
            : `${synced} gastos sincronizados`,
        );
      }
    };

    void offlineExpenseQueue.count().then(setPendingCount);
    void sync();

    window.addEventListener('online', sync);
    return () => {
      window.removeEventListener('online', sync);
      unsubscribe();
    };
  }, []);

  return pendingCount;
}
