import api from './api';
import { InAppNotification } from '@/types/in-app-notification';

export const inAppNotificationsService = {
  async list(options?: {
    unreadOnly?: boolean;
  }): Promise<{ notifications: InAppNotification[] }> {
    const response = await api.get('/in-app-notifications', {
      params: options?.unreadOnly ? { unreadOnly: 'true' } : undefined,
    });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get('/in-app-notifications/unread-count');
    return response.data;
  },

  async markAsRead(id: string): Promise<{ notification: InAppNotification }> {
    const response = await api.patch(`/in-app-notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const response = await api.patch('/in-app-notifications/read-all');
    return response.data;
  },
};
