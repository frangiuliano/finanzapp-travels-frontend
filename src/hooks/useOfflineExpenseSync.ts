import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { processOfflineExpenseQueue } from '@/services/createExpenseWithOffline';
import {
  offlineExpenseQueue,
  subscribeOfflineQueue,
} from '@/services/offlineExpenseQueue';
import { useAuthStore } from '@/store/authStore';

export interface OfflineExpenseSyncState {
  pendingCount: number;
  syncNow: () => Promise<void>;
}

export function useOfflineExpenseSync(): OfflineExpenseSyncState {
  const userId = useAuthStore((state) => state.user?.id);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeOfflineQueue(userId, setPendingCount);

    const sync = async () => {
      const { synced } = await processOfflineExpenseQueue();
      if (synced > 0) {
        toast.success(
          synced === 1
            ? '1 gasto sincronizado'
            : `${synced} gastos sincronizados`,
        );
      }
    };

    void offlineExpenseQueue.countForUser(userId).then(setPendingCount);
    void sync();

    window.addEventListener('online', sync);
    return () => {
      window.removeEventListener('online', sync);
      unsubscribe();
    };
  }, [userId]);

  const syncNow = async () => {
    const { synced } = await processOfflineExpenseQueue();
    if (synced > 0) {
      toast.success(
        synced === 1
          ? '1 gasto sincronizado'
          : `${synced} gastos sincronizados`,
      );
    }
  };

  return { pendingCount: userId ? pendingCount : 0, syncNow };
}
