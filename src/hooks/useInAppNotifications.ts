import { useCallback, useEffect, useState } from 'react';
import { inAppNotificationsService } from '@/services/inAppNotificationsService';
import { InAppNotification } from '@/types/in-app-notification';

export function useInAppNotifications(options?: { pollIntervalMs?: number }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [listResult, countResult] = await Promise.all([
        inAppNotificationsService.list(),
        inAppNotificationsService.getUnreadCount(),
      ]);
      setNotifications(listResult.notifications);
      setUnreadCount(countResult.count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (!options?.pollIntervalMs) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, options.pollIntervalMs);

    return () => window.clearInterval(interval);
  }, [refresh, options?.pollIntervalMs]);

  const markAsRead = useCallback(
    async (id: string) => {
      await inAppNotificationsService.markAsRead(id);
      await refresh();
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    await inAppNotificationsService.markAllAsRead();
    await refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
