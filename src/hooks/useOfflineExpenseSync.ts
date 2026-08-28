import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { processOfflineExpenseQueue } from '@/services/createExpenseWithOffline';
import {
  offlineExpenseQueue,
  subscribeOfflineQueue,
} from '@/services/offlineExpenseQueue';
import { useAuthStore } from '@/store/authStore';

export function useOfflineExpenseSync(): number {
  const userId = useAuthStore((state) => state.user?.id);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = subscribeOfflineQueue(userId, setPendingCount);

    const sync = async () => {
      const { synced, purged } = await processOfflineExpenseQueue();
      if (purged > 0) {
        toast.error(
          purged === 1
            ? 'Se descartó 1 gasto pendiente por pasar demasiado tiempo sin sincronizar'
            : `Se descartaron ${purged} gastos pendientes por pasar demasiado tiempo sin sincronizar`,
        );
      }
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

  return userId ? pendingCount : 0;
}
