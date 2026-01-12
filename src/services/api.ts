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

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/forgot-password') ||
      originalRequest?.url?.includes('/auth/reset-password') ||
      originalRequest?.url?.includes('/auth/verify-email');

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
