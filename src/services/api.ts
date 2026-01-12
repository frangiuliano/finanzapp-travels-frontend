import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Lista de endpoints de autenticación que NO deben intentar refresh
    const authEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/refresh', // Excluir también el propio endpoint de refresh para evitar loops
    ];

    // Verificar si el request es a un endpoint de autenticación
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    // Solo intentar refresh si:
    // 1. Es un error 401
    // 2. No es un endpoint de autenticación
    // 3. No se ha intentado refresh ya
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken, user } = response.data;
        useAuthStore.getState().setAuth(user, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
