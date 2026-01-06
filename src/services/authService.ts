import api from './api';
import { useAuthStore } from '@/store/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data;
    useAuthStore.getState().setAuth(user, accessToken);
    return { user, accessToken };
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    const { accessToken, user } = response.data;
    useAuthStore.getState().setAuth(user, accessToken);
    return { user, accessToken };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
