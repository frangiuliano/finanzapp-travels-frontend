import api from './api';
import { useAuthStore } from '@/store/authStore';
import { offlineExpenseQueue } from '@/services/offlineExpenseQueue';
import { clearOfflineIdentity } from '@/lib/offlineIdentity';

interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data;
    useAuthStore.getState().setAuth(user, accessToken);
    const fullUser = await authService.getCurrentUser();
    useAuthStore.getState().setAuth(fullUser, accessToken);
    return { user: fullUser, accessToken };
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data as { message: string; email: string };
  },

  async resendVerification(email: string) {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data as { message: string };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(
        'Error al cerrar sesión:',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        await offlineExpenseQueue.clearForUser(userId);
      }
      useAuthStore.getState().clearAuth();
      clearOfflineIdentity();
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    email?: string;
    username?: string;
  }) {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  async confirmEmailChange(token: string) {
    const response = await api.post('/auth/confirm-email-change', { token });
    useAuthStore.getState().clearAuth();
    clearOfflineIdentity();
    return response.data as { message: string };
  },

  async cancelEmailChange() {
    const response = await api.delete('/auth/pending-email-change');
    return response.data as { message: string };
  },
};
