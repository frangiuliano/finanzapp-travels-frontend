import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return import.meta.env.DEV ? '/api' : 'http://localhost:8080/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

let refreshPromise: Promise<{ accessToken: string; user: unknown }> | null =
  null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/refresh',
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .then((res) => {
            const { accessToken, user } = res.data;
            useAuthStore.getState().setAuth(user, accessToken);
            refreshPromise = null;
            return { accessToken, user };
          })
          .catch((err) => {
            refreshPromise = null;
            throw err;
          });
      }

      try {
        const { accessToken } = await refreshPromise;
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
